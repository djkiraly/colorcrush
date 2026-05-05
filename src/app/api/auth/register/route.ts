import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email-notifications";
import { issueVerificationEmail } from "@/lib/auth-verification";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  address: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, address } = registerSchema.parse(body);

    const [existing] = await db
      .select({
        id: users.id,
        isGuest: users.isGuest,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing && (!existing.isGuest || existing.passwordHash)) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing?.isGuest) {
      // Upgrade the guest stub — existing orders stay linked via userId.
      [user] = await db
        .update(users)
        .set({
          name,
          passwordHash,
          isGuest: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
    } else {
      [user] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
          role: "customer",
        })
        .returning();
    }

    // Save address if provided
    if (address?.line1) {
      await db.insert(addresses).values({
        userId: user.id,
        label: "Home",
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        zip: address.zip,
        isDefault: true,
      });
    }

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(user.id, email, name).catch(() => {});

    // Send verification email — await it so the email actually queues before
    // we return. Bypass the per-user rate limit since this is the first
    // email this user will see.
    try {
      await issueVerificationEmail(email, { bypassRateLimit: true });
    } catch (e) {
      console.error("Failed to send verification email on register:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
