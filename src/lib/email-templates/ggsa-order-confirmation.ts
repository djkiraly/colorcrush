import { emailLayout, ctaButton, loadEmailSettings } from "./base";

interface GgsaOrderConfirmationData {
  contactName: string;
  flavorLabel: string;
  quantity: number;
  total: number; // dollars
  pickupDate: string; // human-readable, e.g. "Monday, June 9"
  pickupNotice: string;
}

/**
 * Customer receipt for a GGSA Team Sweet Bag order.
 */
export async function ggsaOrderConfirmationEmail(
  data: GgsaOrderConfirmationData
): Promise<string> {
  const s = await loadEmailSettings();

  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${s.colors.secondary};font-size:22px;">
      Thank you for your order!
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      Hi ${data.contactName}, your Team Sweet Bag order is confirmed. Thank you
      for supporting the Gering Girls Softball Association!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr style="background-color:#F3F4F6;">
        <td style="padding:8px;font-weight:600;font-size:13px;">Item</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:center;">Qty</td>
        <td style="padding:8px;font-weight:600;font-size:13px;text-align:right;">Total</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;">Team Sweet Bag — ${data.flavorLabel} (3 oz)</td>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:center;">${data.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;text-align:right;">$${data.total.toFixed(2)}</td>
      </tr>
    </table>

    <div style="margin:24px 0;padding:16px;background-color:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;">
      <p style="margin:0 0 4px;font-weight:700;color:#0F766E;font-size:15px;">
        Pick up on: ${data.pickupDate}
      </p>
      <p style="margin:0;color:#334155;font-size:13px;line-height:1.6;">
        ${data.pickupNotice}
      </p>
    </div>

    ${ctaButton(s, "Order more bags", `${s.url}/ggsa`)}
    `,
    `Your Team Sweet Bag order is confirmed — pickup ${data.pickupDate}.`
  );
}
