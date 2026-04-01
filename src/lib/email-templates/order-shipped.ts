import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingCarrier: string;
  orderId: string;
}

export function orderShippedEmail(data: OrderShippedData): string {
  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Your order is on its way!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Great news, ${data.customerName}! Your order <strong>${data.orderNumber}</strong> has been shipped.
    </p>

    <div style="background-color:#F0F9FF;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#1E1B2E;"><strong>Tracking Details</strong></p>
      <p style="margin:0 0 4px;font-size:14px;color:#6B7280;">Carrier: ${data.trackingCarrier}</p>
      <p style="margin:0;font-size:14px;color:#6B7280;">Tracking #: <strong>${data.trackingNumber}</strong></p>
    </div>

    ${ctaButton("Track Your Order", `${siteConfig.url}/account/orders/${data.orderId}`)}
    `,
    `Your order ${data.orderNumber} has shipped!`
  );
}
