import { google } from "googleapis";
import { siteConfig } from "../../site.config";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName?: string;
  userId?: string;
  orderId?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  templateName,
  userId,
  orderId,
}: SendEmailOptions): Promise<boolean> {
  const from = process.env.GMAIL_SEND_FROM || siteConfig.contact.email;

  const message = [
    `From: ${siteConfig.name} <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ].join("\r\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    await db.insert(emailLog).values({
      userId,
      orderId,
      templateName,
      to,
      subject,
      status: "sent",
      sentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);

    await db.insert(emailLog).values({
      userId,
      orderId,
      templateName,
      to,
      subject,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return false;
  }
}
