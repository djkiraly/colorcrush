import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { products, coupons, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { siteConfig } from "../../../../site.config";
import { recordSystemAlert } from "@/lib/system-alerts";
import { getPublicBaseUrl } from "@/lib/app-url";

interface SelectedRateInput {
  rateId: string;
  carrier: string;
  service: string;
  amountCents: number;
  estimatedDays: number | null;
}

interface GuestInfo {
  email: string;
  name: string;
  createAccount?: boolean;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      couponCode,
      giftMessage,
      isGift,
      guest,
      shippingRate,
    }: {
      items: { productId: string; quantity: number }[];
      couponCode?: string;
      giftMessage?: string;
      isGift?: boolean;
      guest?: GuestInfo;
      shippingRate?: SelectedRateInput;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shippingRate || !shippingRate.rateId) {
      return NextResponse.json({ error: "Shipping option not selected" }, { status: 400 });
    }

    // Resolve userId server-side: prefer authed session, fall back to guest path.
    const session = await auth();
    const sessionUserId = session?.user?.id;
    let userId: string;
    let triggerVerifyEmail = false;

    if (sessionUserId) {
      userId = sessionUserId;
    } else {
      // Guest path
      if (!guest?.email || !guest?.name) {
        return NextResponse.json(
          { error: "Email and name are required for guest checkout" },
          { status: 400 }
        );
      }
      const email = guest.email.trim().toLowerCase();
      const name = guest.name.trim();

      if (guest.createAccount && (!guest.password || guest.password.length < 8)) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const [existing] = await db
        .select({
          id: users.id,
          isGuest: users.isGuest,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        if (!existing.isGuest || existing.passwordHash) {
          // Real account exists — refuse to hijack it.
          return NextResponse.json(
            {
              error:
                "An account with that email already exists. Please sign in to complete your purchase.",
              code: "ACCOUNT_EXISTS",
            },
            { status: 409 }
          );
        }
        // Reuse the existing guest stub.
        userId = existing.id;
        if (guest.createAccount && guest.password) {
          // Upgrade guest stub to a real account.
          const passwordHash = await bcrypt.hash(guest.password, 12);
          await db
            .update(users)
            .set({ passwordHash, isGuest: false, name, updatedAt: new Date() })
            .where(eq(users.id, existing.id));
          triggerVerifyEmail = true;
        } else {
          // Keep as guest, but refresh name.
          await db
            .update(users)
            .set({ name, updatedAt: new Date() })
            .where(eq(users.id, existing.id));
        }
      } else {
        const passwordHash = guest.createAccount && guest.password
          ? await bcrypt.hash(guest.password, 12)
          : null;
        const [created] = await db
          .insert(users)
          .values({
            email,
            name,
            role: "customer",
            passwordHash,
            isGuest: !guest.createAccount,
          })
          .returning({ id: users.id });
        userId = created.id;
        triggerVerifyEmail = !!guest.createAccount;
      }
    }

    // Fetch products
    const productIds = items.map((i) => i.productId);
    const productRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const lineItems = items.map((item) => {
      const product = productRows.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      return {
        price_data: {
          currency: siteConfig.currency.toLowerCase(),
          product_data: {
            name: product.name,
            description: product.shortDescription || undefined,
          },
          unit_amount: Math.round(parseFloat(product.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    // Handle coupon
    let discountAmount = 0;
    if (couponCode) {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase()))
        .limit(1);

      if (coupon && coupon.isActive) {
        const subtotal = items.reduce((sum, item) => {
          const product = productRows.find((p) => p.id === item.productId);
          return sum + (product ? parseFloat(product.price) * item.quantity : 0);
        }, 0);

        if (coupon.type === "percentage") {
          discountAmount = subtotal * (parseFloat(coupon.value) / 100);
        } else if (coupon.type === "fixed") {
          discountAmount = parseFloat(coupon.value);
        }
      }
    }

    // Shipping line item from selected Shippo (or flat) rate
    const shippingLineItem = {
      price_data: {
        currency: siteConfig.currency.toLowerCase(),
        product_data: {
          name:
            shippingRate.carrier === "flat"
              ? `Shipping — ${shippingRate.service}`
              : `Shipping — ${shippingRate.carrier.toUpperCase()} ${shippingRate.service}`,
        },
        unit_amount: shippingRate.amountCents,
      },
      quantity: 1,
    };

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...lineItems, shippingLineItem],
      metadata: {
        userId,
        couponCode: couponCode || "",
        giftMessage: giftMessage || "",
        isGift: isGift ? "true" : "false",
        discountAmount: discountAmount.toFixed(2),
        shippoRateId: shippingRate.rateId,
        shippingCarrier: shippingRate.carrier,
        shippingService: shippingRate.service,
        shippingRateCents: String(shippingRate.amountCents),
        shippingEstimatedDays:
          shippingRate.estimatedDays != null ? String(shippingRate.estimatedDays) : "",
        triggerVerifyEmail: triggerVerifyEmail ? "true" : "false",
      },
      success_url: `${await getPublicBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${await getPublicBaseUrl()}/cart`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);

    // Surface to the admin dashboard + email admins. Stripe auth/key
    // problems are the most common cause and the most urgent to fix.
    const errMsg = error instanceof Error ? error.message : String(error);
    const errType =
      (error as { type?: string })?.type || (error as { name?: string })?.name || "";
    const isStripeAuth =
      errType === "StripeAuthenticationError" ||
      /Invalid API Key|api_key/i.test(errMsg);

    recordSystemAlert({
      severity: "critical",
      title: isStripeAuth
        ? "Stripe checkout failing — invalid API key"
        : "Failed to create Stripe checkout session",
      message: [
        `Error: ${errMsg}`,
        errType ? `Type: ${errType}` : "",
        isStripeAuth
          ? "The Stripe secret key the server is using was rejected by Stripe. Check Admin → Settings → Stripe (or STRIPE_SECRET_KEY env var) and ensure the running process has the correct value."
          : "Customers cannot complete checkout until this is resolved.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    }).catch(() => {});

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
