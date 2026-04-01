import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, templateName, userId, orderId } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, and html are required" },
        { status: 400 }
      );
    }

    const success = await sendEmail({
      to,
      subject,
      html,
      templateName,
      userId,
      orderId,
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
