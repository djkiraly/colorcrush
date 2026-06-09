import { emailLayout, loadEmailSettings } from "./base";

interface GgsaOrderNotificationData {
  contactName: string;
  email: string;
  phone: string;
  flavorLabel: string;
  quantity: number;
  total: number; // dollars
  pickupDate: string; // human-readable
  orderedAt: string; // human-readable
}

/**
 * Internal alert to the store/GGSA contact: a new Team Sweet Bag order needs
 * to be bagged for concession-stand pickup.
 */
export async function ggsaOrderNotificationEmail(
  data: GgsaOrderNotificationData
): Promise<string> {
  const s = await loadEmailSettings();

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#6B7280;width:140px;">${label}</td>
      <td style="padding:6px 0;font-size:14px;color:#1E1B2E;font-weight:600;">${value}</td>
    </tr>`;

  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${s.colors.secondary};font-size:22px;">
      New GGSA Team Sweet Bag order
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      A new order came in and needs to be bagged for pickup at the concession stand.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      ${row("Flavor", `${data.flavorLabel} (3 oz)`)}
      ${row("Quantity", String(data.quantity))}
      ${row("Total paid", `$${data.total.toFixed(2)}`)}
      ${row("Pick up by", data.pickupDate)}
      ${row("Ordered", data.orderedAt)}
    </table>

    <div style="margin:20px 0;padding:16px;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;">
      <p style="margin:0 0 8px;font-weight:700;color:#1E1B2E;font-size:14px;">Customer</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("Name", data.contactName)}
        ${row("Email", `<a href="mailto:${data.email}" style="color:${s.colors.primary};">${data.email}</a>`)}
        ${row("Phone", `<a href="tel:${data.phone}" style="color:${s.colors.primary};">${data.phone}</a>`)}
      </table>
    </div>
    `,
    `New GGSA order: ${data.quantity} × ${data.flavorLabel} for ${data.pickupDate}.`
  );
}
