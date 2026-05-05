import { getSettings } from "@/lib/settings";
import type { SiteConfig } from "../../../site.config";

export type EmailSettings = SiteConfig;

export async function loadEmailSettings(): Promise<EmailSettings> {
  return getSettings();
}

/**
 * Build the footer contact block from settings, preferring values the
 * admin has actually configured. Source of truth order:
 *   1. settings.contact.* (if set in Admin → Settings → Contact)
 *   2. settings.shipping.origin.* (always set — required for Shippo rates)
 *
 * Returns empty strings for anything still missing so the layout can
 * gracefully omit lines.
 */
function resolveFooterContact(settings: EmailSettings): {
  address: string;
  email: string;
  phone: string;
} {
  const contact = settings.contact || ({} as { address?: string; email?: string; phone?: string });
  const origin = settings.shipping?.origin;

  const originAddress = origin
    ? [
        origin.street1,
        origin.street2,
        [origin.city, origin.state, origin.zip].filter(Boolean).join(" "),
        origin.country !== "US" ? origin.country : "",
      ]
        .filter((p) => p && p.trim())
        .join(", ")
    : "";

  return {
    address: contact.address?.trim() || originAddress,
    email: contact.email?.trim() || origin?.email || "",
    phone: contact.phone?.trim() || origin?.phone || "",
  };
}

export function emailLayout(
  settings: EmailSettings,
  content: string,
  preheader?: string
): string {
  const footer = resolveFooterContact(settings);
  const contactLine = [footer.email, footer.phone].filter(Boolean).join(" | ");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background-color:#FAFAFA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAFA;">
    <tr><td align="center" style="padding:20px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color:${settings.colors.secondary};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-family:'Poppins',Arial,sans-serif;font-size:24px;font-weight:700;">
              ${settings.name}
            </h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background-color:#F3F4F6;text-align:center;border-top:1px solid #E5E7EB;">
            ${
              footer.address
                ? `<p style="margin:0 0 8px;font-size:14px;color:#6B7280;">${footer.address}</p>`
                : ""
            }
            ${
              contactLine
                ? `<p style="margin:0 0 8px;font-size:14px;color:#6B7280;">${contactLine}</p>`
                : ""
            }
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              &copy; ${new Date().getFullYear()} ${settings.name}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ctaButton(settings: EmailSettings, text: string, url: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:24px 0;">
        <a href="${url}" style="display:inline-block;background-color:${settings.colors.primary};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:12px;">
          ${text}
        </a>
      </td></tr>
    </table>`;
}
