import { google } from "googleapis";
import { siteConfig } from "../../site.config";
import { db } from "@/lib/db";
import { emailLog, siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";

interface GmailSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sendFrom: string;
}

async function loadGmailConfig(): Promise<GmailSettings> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "gmail"))
      .limit(1);

    if (row?.value) {
      const val = row.value as GmailSettings;
      return {
        clientId: val.clientId || process.env.GMAIL_CLIENT_ID || "",
        clientSecret: val.clientSecret || process.env.GMAIL_CLIENT_SECRET || "",
        refreshToken: val.refreshToken || process.env.GMAIL_REFRESH_TOKEN || "",
        sendFrom: val.sendFrom || process.env.GMAIL_SEND_FROM || siteConfig.contact.email,
      };
    }
  } catch {
    // DB not available
  }

  return {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || "",
    sendFrom: process.env.GMAIL_SEND_FROM || siteConfig.contact.email,
  };
}

async function getGmailClient() {
  const config = await loadGmailConfig();

  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error("Gmail API not configured: missing clientId, clientSecret, or refreshToken");
  }

  // Rebuild client each time to pick up config changes
  // (cheap operation — just sets credentials)
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return { gmail, sendFrom: config.sendFrom };
}

/**
 * Force-rebuild the Gmail client on next call (e.g. after settings change).
 */
export function invalidateGmailClient(): void {
  // No-op: Gmail client is not cached.
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName?: string;
  userId?: string;
  orderId?: string;
}

/**
 * RFC 2047 encoded-word for header values. Mail headers are 7-bit ASCII;
 * non-ASCII chars (em dashes, accented letters, smart quotes) must be
 * wrapped as `=?UTF-8?B?<base64>?=` or recipients see mojibake. ASCII-only
 * values pass through unchanged so legacy clients aren't confused.
 */
function encodeHeaderWord(value: string): string {
  // Fast path: pure ASCII, no encoding needed.
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const base64 = Buffer.from(value, "utf8").toString("base64");
  return `=?UTF-8?B?${base64}?=`;
}

export async function sendEmail({
  to,
  subject,
  html,
  templateName,
  userId,
  orderId,
}: SendEmailOptions): Promise<boolean> {
  try {
    const { gmail, sendFrom } = await getGmailClient();
    const settings = await getSettings();

    const message = [
      `From: ${encodeHeaderWord(settings.name)} <${sendFrom}>`,
      `To: ${to}`,
      `Subject: ${encodeHeaderWord(subject)}`,
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

/**
 * Test the Gmail API connection by fetching the user's profile.
 */
export async function testGmailConnection(): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  try {
    const { gmail } = await getGmailClient();
    const profile = await gmail.users.getProfile({ userId: "me" });
    return {
      success: true,
      email: profile.data.emailAddress || undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
