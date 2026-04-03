import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isSuperAdmin } from "@/lib/auth-helpers";
import { staffUpdateSchema } from "@/lib/validators/staff";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = staffUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing || (existing.role !== "admin" && existing.role !== "super_admin")) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Prevent self-demotion from super_admin
  if (existing.id === session!.user!.id && existing.role === "super_admin" && parsed.data.role !== "super_admin") {
    return NextResponse.json(
      { error: "You cannot demote yourself from super admin" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    phone: parsed.data.phone || null,
    updatedAt: new Date(),
  };

  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session!.user!.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own access" },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing || (existing.role !== "admin" && existing.role !== "super_admin")) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Downgrade to customer (preserves FK references)
  await db
    .update(users)
    .set({ role: "customer", updatedAt: new Date() })
    .where(eq(users.id, id));

  return NextResponse.json({ success: true });
}
