import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { createManualOrderSchema } from "@/lib/validators/manual-order";
import { createDraftOrder } from "@/lib/admin-orders/build-draft";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = createManualOrderSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Validation failed", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  try {
    const { orderId, orderNumber } = await createDraftOrder(parsed, session!.user!.id!);
    return NextResponse.json({ orderId, orderNumber });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create draft order" },
      { status: 400 }
    );
  }
}
