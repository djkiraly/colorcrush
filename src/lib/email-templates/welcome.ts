import { emailLayout, ctaButton, loadEmailSettings } from "./base";

export async function welcomeEmail(customerName: string): Promise<string> {
  const s = await loadEmailSettings();
  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${s.colors.secondary};font-size:22px;">
      Welcome to ${s.name}!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${customerName}, welcome to the sweetest corner of the internet!
      We're thrilled to have you join the ${s.name} family.
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      As a welcome gift, use code <strong style="color:${s.colors.primary};">WELCOME5</strong>
      to get $5 off your first order.
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Browse our collection of handcrafted candies, build your own custom box,
      or discover the perfect gift for someone special.
    </p>

    ${ctaButton(s, "Start Shopping", `${s.url}/products`)}
    `,
    `Welcome to ${s.name}! Here's $5 off your first order.`
  );
}
