import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { sendOrderConfirmationEmail } from "@/lib/email-notifications";
import { logOrderAction } from "@/lib/order-audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await sendOrderConfirmationEmail(id);
    logOrderAction({
      orderId: id,
      adminId: session?.user?.id,
      action: "receipt_resent",
      details: "Order confirmation receipt resent to customer",
    }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 }
    );
  }
}
