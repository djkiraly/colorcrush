import { emailLayout, ctaButton, loadEmailSettings } from "./base";

interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingCarrier: string;
  orderId: string;
  trackingUrl?: string | null;
}

export async function orderShippedEmail(data: OrderShippedData): Promise<string> {
  const s = await loadEmailSettings();

  const trackingDisplay = data.trackingUrl
    ? `<a href="${data.trackingUrl}" style="color:${s.colors.primary};text-decoration:underline;font-weight:600;">${data.trackingNumber}</a>`
    : `<strong>${data.trackingNumber}</strong>`;

  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${s.colors.secondary};font-size:22px;">
      Your order is on its way!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Great news, ${data.customerName}! Your order <strong>${data.orderNumber}</strong> has been shipped.
    </p>

    <div style="background-color:#F0F9FF;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#1E1B2E;"><strong>Tracking Details</strong></p>
      ${
        data.trackingCarrier
          ? `<p style="margin:0 0 4px;font-size:14px;color:#6B7280;">Carrier: ${data.trackingCarrier.toUpperCase()}</p>`
          : ""
      }
      <p style="margin:0;font-size:14px;color:#6B7280;">Tracking #: ${trackingDisplay}</p>
    </div>

    ${ctaButton(
      s,
      data.trackingUrl ? "Track Shipment" : "View Order",
      data.trackingUrl || `${s.url}/account/orders/${data.orderId}`
    )}
    `,
    `Your order ${data.orderNumber} has shipped!`
  );
}
