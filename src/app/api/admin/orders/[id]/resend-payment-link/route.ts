import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { issuePaymentLink } from "@/lib/admin-orders/payment-link";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const adminId = (session?.user as { id?: string })?.id;

  try {
    const { payUrl, expiresAt } = await issuePaymentLink(id, adminId, true);
    return NextResponse.json({ payUrl, expiresAt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to resend link" },
      { status: 400 }
    );
  }
}
