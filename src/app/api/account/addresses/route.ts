import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth-helpers";
import { addressInputSchema } from "@/lib/validators/address";

export async function GET() {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.isGuest, false)))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));

  return NextResponse.json({ addresses: rows });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = addressInputSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid address", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  // If this is the user's first non-guest address, force it to default.
  const [existing] = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.userId, userId), eq(addresses.isGuest, false)))
    .limit(1);
  const shouldDefault = parsed.isDefault || !existing;

  if (shouldDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));
  }

  const [created] = await db
    .insert(addresses)
    .values({
      userId,
      label: parsed.label ?? null,
      recipientName: parsed.recipientName,
      phone: parsed.phone,
      line1: parsed.line1,
      line2: parsed.line2 ?? null,
      city: parsed.city,
      state: parsed.state.toUpperCase(),
      zip: parsed.zip,
      country: parsed.country,
      isDefault: shouldDefault,
      isGuest: false,
    })
    .returning();

  return NextResponse.json({ address: created });
}
