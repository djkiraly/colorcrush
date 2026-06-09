import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { ggsaOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { getPublicBaseUrl } from "@/lib/app-url";
import { recordSystemAlert } from "@/lib/system-alerts";
import { siteConfig } from "../../../../../site.config";
import {
  ggsaOrderSchema,
  GGSA_UNIT_PRICE_CENTS,
  GGSA_FLAVOR_LABELS,
} from "@/lib/validators/ggsa";
import { getNextPickupDate } from "@/lib/ggsa-pickup";

export async function POST(request: NextRequest) {
  try {
    // The page must be enabled for orders to be accepted.
    const settings = await getSettings();
    if (!settings.ggsa?.enabled) {
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ggsaOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid order" },
        { status: 400 }
      );
    }
    const { flavor, quantity, contactName, email, phone } = parsed.data;

    const totalCents = GGSA_UNIT_PRICE_CENTS * quantity;
    const pickupDate = getNextPickupDate();

    // Create the pending order first so we can stamp its id into the Stripe
    // session metadata; the session id is written back below before redirect.
    const [order] = await db
      .insert(ggsaOrders)
      .values({
        flavor,
        quantity,
        unitPriceCents: GGSA_UNIT_PRICE_CENTS,
        totalCents,
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status: "pending",
        pickupDate,
      })
      .returning({ id: ggsaOrders.id });

    const baseUrl = await getPublicBaseUrl();

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email.trim().toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: siteConfig.currency.toLowerCase(),
            product_data: {
              name: `Team Sweet Bag — ${GGSA_FLAVOR_LABELS[flavor]} (3 oz)`,
              description: "GGSA concession-stand pickup. Supports the Gering Girls Softball Association.",
            },
            unit_amount: GGSA_UNIT_PRICE_CENTS,
          },
          quantity,
        },
      ],
      metadata: {
        source: "ggsa",
        ggsaOrderId: order.id,
        flavor,
        quantity: String(quantity),
      },
      success_url: `${baseUrl}/ggsa/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/ggsa`,
    });

    await db
      .update(ggsaOrders)
      .set({ stripeSessionId: stripeSession.id, updatedAt: new Date() })
      .where(eq(ggsaOrders.id, order.id));

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("GGSA checkout error:", error);

    const errMsg = error instanceof Error ? error.message : String(error);
    const errType =
      (error as { type?: string })?.type || (error as { name?: string })?.name || "";
    const isStripeAuth =
      errType === "StripeAuthenticationError" || /Invalid API Key|api_key/i.test(errMsg);

    recordSystemAlert({
      severity: "critical",
      title: isStripeAuth
        ? "GGSA checkout failing — invalid Stripe API key"
        : "Failed to create GGSA Stripe checkout session",
      message: [
        `Error: ${errMsg}`,
        errType ? `Type: ${errType}` : "",
        "GGSA Team Sweet Bag orders cannot complete checkout until this is resolved.",
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
