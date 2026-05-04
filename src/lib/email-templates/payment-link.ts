import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

interface PaymentLinkData {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  payUrl: string;
  expiresAt: Date;
}

export function paymentLinkEmail(data: PaymentLinkData): string {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;">${item.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const expiresFmt = data.expiresAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Your order is ready for payment
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${data.customerName}, we've prepared order <strong>${data.orderNumber}</strong> for you.
      Review the details below and complete payment to confirm.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr style="background-color:#F3F4F6;">
        <td style="padding:8px;font-weight:600;font-size:13px;">Item</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:center;">Qty</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:right;">Price</td>
      </tr>
      ${itemRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr><td style="font-size:14px;color:#6B7280;padding:4px 0;">Subtotal</td><td style="text-align:right;font-size:14px;">$${data.subtotal.toFixed(2)}</td></tr>
      <tr><td style="font-size:14px;color:#6B7280;padding:4px 0;">Shipping</td><td style="text-align:right;font-size:14px;">${data.shippingCost === 0 ? "FREE" : `$${data.shippingCost.toFixed(2)}`}</td></tr>
      <tr><td style="font-size:14px;color:#6B7280;padding:4px 0;">Tax</td><td style="text-align:right;font-size:14px;">$${data.taxAmount.toFixed(2)}</td></tr>
      <tr><td style="font-size:16px;font-weight:700;color:${siteConfig.colors.primary};padding:12px 0 0;border-top:2px solid #E5E7EB;">Total Due</td><td style="text-align:right;font-size:16px;font-weight:700;color:${siteConfig.colors.primary};padding:12px 0 0;border-top:2px solid #E5E7EB;">$${data.total.toFixed(2)}</td></tr>
    </table>

    ${ctaButton("Review & Pay", data.payUrl)}

    <p style="color:#9CA3AF;font-size:12px;line-height:1.6;text-align:center;">
      This payment link expires on ${expiresFmt}.<br>
      If you didn't expect this email, you can safely ignore it.
    </p>
    `,
    `Order ${data.orderNumber} ready for payment — $${data.total.toFixed(2)}`
  );
}
