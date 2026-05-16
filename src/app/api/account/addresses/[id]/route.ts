import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth-helpers";
import { addressInputSchema } from "@/lib/validators/address";

async function requireUserId() {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return userId ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;

  let parsed;
  try {
    parsed = addressInputSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid address", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  // Confirm ownership before any mutation
  const [existing] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  if (parsed.isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(eq(addresses.userId, userId), ne(addresses.id, id)));
  }

  const [updated] = await db
    .update(addresses)
    .set({
      label: parsed.label ?? null,
      recipientName: parsed.recipientName,
      phone: parsed.phone,
      line1: parsed.line1,
      line2: parsed.line2 ?? null,
      city: parsed.city,
      state: parsed.state.toUpperCase(),
      zip: parsed.zip,
      country: parsed.country,
      isDefault: parsed.isDefault ?? existing.isDefault,
    })
    .where(eq(addresses.id, id))
    .returning();

  return NextResponse.json({ address: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await db.delete(addresses).where(eq(addresses.id, id));

  // If we just removed the default, promote the most-recent remaining address.
  if (existing.isDefault) {
    const [next] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.userId, userId), eq(addresses.isGuest, false)))
      .limit(1);
    if (next) {
      await db
        .update(addresses)
        .set({ isDefault: true })
        .where(eq(addresses.id, next.id));
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Only PATCH usage right now is "make this the default"
  if (body?.isDefault !== true) {
    return NextResponse.json(
      { error: "Only { isDefault: true } is supported on PATCH" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(eq(addresses.userId, userId));
  await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, id));

  return NextResponse.json({ success: true });
}
