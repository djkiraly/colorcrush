import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

export function welcomeEmail(customerName: string): string {
  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Welcome to ${siteConfig.name}!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${customerName}, welcome to the sweetest corner of the internet!
      We're thrilled to have you join the ${siteConfig.name} family.
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      As a welcome gift, use code <strong style="color:${siteConfig.colors.primary};">WELCOME5</strong>
      to get $5 off your first order.
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Browse our collection of handcrafted candies, build your own custom box,
      or discover the perfect gift for someone special.
    </p>

    ${ctaButton("Start Shopping", `${siteConfig.url}/products`)}
    `,
    `Welcome to ${siteConfig.name}! Here's $5 off your first order.`
  );
}
