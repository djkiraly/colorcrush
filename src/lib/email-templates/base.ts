import { siteConfig } from "../../../site.config";

export function emailLayout(content: string, preheader?: string): string {
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
          <td style="background-color:${siteConfig.colors.secondary};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#FFFFFF;font-family:'Poppins',Arial,sans-serif;font-size:24px;font-weight:700;">
              ${siteConfig.name}
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
            <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">
              ${siteConfig.contact.address}
            </p>
            <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">
              ${siteConfig.contact.email} | ${siteConfig.contact.phone}
            </p>
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              &copy; ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ctaButton(text: string, url: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:24px 0;">
        <a href="${url}" style="display:inline-block;background-color:${siteConfig.colors.primary};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:12px;">
          ${text}
        </a>
      </td></tr>
    </table>`;
}
