import { emailLayout, type EmailSettings } from "./base";

/**
 * Wrap an admin-authored HTML body in the standard site email layout (with
 * brand colors + footer + unsubscribe link). The body is the rich-text HTML
 * produced by the admin composer; everything around it is generated.
 */
export function newsletterEmail({
  settings,
  htmlBody,
  preheader,
  unsubscribeUrl,
}: {
  settings: EmailSettings;
  htmlBody: string;
  preheader?: string;
  unsubscribeUrl: string;
}): string {
  // Constrain the rich-text body's typography to match the rest of the email.
  // Quill output is fragments — paragraphs, lists, bold, etc. — so we wrap it
  // with a container that supplies the base font + color.
  const styledBody = `
    <div style="font-family:'Inter',Arial,sans-serif;font-size:16px;line-height:1.6;color:#1E1B2E;">
      ${htmlBody}
    </div>`;
  return emailLayout(settings, styledBody, preheader, unsubscribeUrl);
}
