import { emailLayout, ctaButton, loadEmailSettings } from "./base";

export async function verifyEmailTemplate(
  customerName: string,
  verifyUrl: string
): Promise<string> {
  const s = await loadEmailSettings();
  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${s.colors.secondary};font-size:22px;">
      Verify your email address
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${customerName}, thanks for creating your ${s.name} account!
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Please verify your email address by clicking the button below. This helps us keep your account secure.
    </p>

    ${ctaButton(s, "Verify Email Address", verifyUrl)}

    <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin-top:24px;">
      This link expires in 24 hours. If you didn&apos;t create an account, you can safely ignore this email.
    </p>
    `,
    `Please verify your email to complete your ${s.name} account setup.`
  );
}
