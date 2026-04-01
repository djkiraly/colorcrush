import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

export function passwordResetEmail(customerName: string, resetUrl: string): string {
  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Reset Your Password
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${customerName}, we received a request to reset your password.
      Click the button below to create a new password.
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
    </p>

    ${ctaButton("Reset Password", resetUrl)}

    <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color:${siteConfig.colors.primary};">${resetUrl}</a>
    </p>
    `,
    `Reset your ${siteConfig.name} password`
  );
}
