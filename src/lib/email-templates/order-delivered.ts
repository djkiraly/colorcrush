import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

interface OrderDeliveredData {
  customerName: string;
  orderNumber: string;
  orderId: string;
}

export function orderDeliveredEmail(data: OrderDeliveredData): string {
  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${siteConfig.colors.secondary};font-size:22px;">
      Your order has been delivered!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${data.customerName}, your order <strong>${data.orderNumber}</strong> has been delivered.
      We hope you love your sweet treats!
    </p>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      If you enjoyed your purchase, we'd love to hear about it. Leave a review and help
      other candy lovers discover their next favorite treat.
    </p>

    ${ctaButton("Leave a Review", `${siteConfig.url}/account/orders/${data.orderId}`)}
    `,
    `Your order ${data.orderNumber} has been delivered!`
  );
}
