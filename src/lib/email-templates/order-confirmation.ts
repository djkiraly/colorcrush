import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  orderId: string;
}

export function orderConfirmationEmail(data: OrderConfirmationData): string {
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

  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Thank you for your order!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${data.customerName}, your order <strong>${data.orderNumber}</strong> has been confirmed.
      We're preparing your sweet treats right now!
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
      <tr><td style="font-size:16px;font-weight:700;color:${siteConfig.colors.primary};padding:12px 0 0;border-top:2px solid #E5E7EB;">Total</td><td style="text-align:right;font-size:16px;font-weight:700;color:${siteConfig.colors.primary};padding:12px 0 0;border-top:2px solid #E5E7EB;">$${data.total.toFixed(2)}</td></tr>
    </table>

    ${ctaButton("View Order", `${siteConfig.url}/account/orders/${data.orderId}`)}
    `,
    `Your order ${data.orderNumber} has been confirmed!`
  );
}
