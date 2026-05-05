import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      emailVerified: users.emailVerified,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      hasPassword: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    hasPassword: !!user.hasPassword,
  });
}

const updateSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(20).nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine(
    (data) => {
      // If newPassword set, currentPassword must also be set (unless user has
      // no existing password — we check that server-side after lookup).
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    { message: "Current password required to set a new password" }
  );

export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = updateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof z.ZodError ? err.issues[0].message : "Invalid request" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.name !== undefined) update.name = parsed.name.trim();
  if (parsed.phone !== undefined) update.phone = parsed.phone?.trim() || null;

  if (parsed.newPassword) {
    const [existing] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing?.passwordHash) {
      const ok = await bcrypt.compare(parsed.currentPassword!, existing.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }
    // No existing password (Google-OAuth-only user setting one for the first
    // time) → currentPassword is ignored.

    update.passwordHash = await bcrypt.hash(parsed.newPassword, 12);
  }

  await db.update(users).set(update).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
