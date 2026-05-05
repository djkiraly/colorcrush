import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { issueVerificationEmail } from "@/lib/auth-verification";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [user] = await db
    .select({ email: users.email, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json(
      { error: "Email is already verified" },
      { status: 400 }
    );
  }

  // Bypass rate limit — admin-triggered resends shouldn't be throttled by the
  // customer-facing 60s cooldown.
  const result = await issueVerificationEmail(user.email, { bypassRateLimit: true });

  if (result.status === "sent") {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: `Could not send: ${result.status}` }, { status: 500 });
}
