import { emailLayout, ctaButton } from "./base";
import { siteConfig } from "../../../site.config";

interface LowStockItem {
  name: string;
  sku: string;
  quantity: number;
  threshold: number;
}

export function lowStockAlertEmail(items: LowStockItem[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #F3F4F6;font-size:14px;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #F3F4F6;font-size:14px;font-family:monospace;">${item.sku}</td>
      <td style="padding:8px;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:center;color:${item.quantity === 0 ? "#EF4444" : "#F59E0B"};font-weight:700;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:center;">${item.threshold}</td>
    </tr>`
    )
    .join("");

  return emailLayout(
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:#EF4444;font-size:22px;">
      Low Stock Alert
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      The following products are below their low stock threshold and may need restocking:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr style="background-color:#FEF2F2;">
        <td style="padding:8px;font-weight:600;font-size:13px;">Product</td>
        <td style="padding:8px;font-weight:600;font-size:13px;">SKU</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:center;">Current</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:center;">Threshold</td>
      </tr>
      ${rows}
    </table>

    ${ctaButton("View Inventory", `${siteConfig.url}/admin/inventory`)}
    `,
    `${items.length} product(s) are running low on stock`
  );
}
