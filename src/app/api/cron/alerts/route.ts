export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduledAlerts, products, inventory, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/gmail";
import { siteConfig } from "../../../../../site.config";
import { and, eq, lte, or, isNull, inArray } from "drizzle-orm";

// POST (or GET) /api/cron/alerts
// Scans for unacknowledged, not-yet-notified alerts whose firing condition is
// met. Sends an email for each and marks `notified_at`. Safe to run on a cron
// as frequently as you want — alerts notify once per cycle.
//
// Auth: `Authorization: Bearer <CRON_SECRET>` header required. If CRON_SECRET
// is not set in env, the endpoint refuses to run at all.
async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. Date alerts that have passed their trigger time, unacknowledged, not notified.
  const dateRows = await db
    .select({
      id: scheduledAlerts.id,
      severity: scheduledAlerts.severity,
      title: scheduledAlerts.title,
      message: scheduledAlerts.message,
      triggerAt: scheduledAlerts.triggerAt,
      productId: scheduledAlerts.productId,
      productName: products.name,
      thresholdQuantity: scheduledAlerts.thresholdQuantity,
    })
    .from(scheduledAlerts)
    .leftJoin(products, eq(scheduledAlerts.productId, products.id))
    .where(
      and(
        eq(scheduledAlerts.isAcknowledged, false),
        isNull(scheduledAlerts.notifiedAt),
        eq(scheduledAlerts.type, "date"),
        or(isNull(scheduledAlerts.triggerAt), lte(scheduledAlerts.triggerAt, now))
      )
    );

  // 2. Inventory alerts where current stock <= threshold, unacknowledged, not notified.
  const invRows = await db
    .select({
      id: scheduledAlerts.id,
      severity: scheduledAlerts.severity,
      title: scheduledAlerts.title,
      message: scheduledAlerts.message,
      triggerAt: scheduledAlerts.triggerAt,
      productId: scheduledAlerts.productId,
      productName: products.name,
      thresholdQuantity: scheduledAlerts.thresholdQuantity,
      currentQuantity: inventory.quantity,
    })
    .from(scheduledAlerts)
    .innerJoin(products, eq(scheduledAlerts.productId, products.id))
    .innerJoin(inventory, eq(inventory.productId, products.id))
    .where(
      and(
        eq(scheduledAlerts.isAcknowledged, false),
        isNull(scheduledAlerts.notifiedAt),
        eq(scheduledAlerts.type, "inventory")
      )
    );

  const firingInv = invRows.filter(
    (r) => r.thresholdQuantity != null && r.currentQuantity <= r.thresholdQuantity
  );

  const firing = [
    ...dateRows.map((r) => ({ ...r, currentQuantity: null as number | null })),
    ...firingInv,
  ];

  if (firing.length === 0) {
    return NextResponse.json({ checked: dateRows.length + invRows.length, notified: 0 });
  }

  // Resolve recipient(s): every super_admin + admin user with a valid email.
  const recipients = await db
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.role, ["super_admin", "admin"]));
  const to = recipients.map((r) => r.email).filter(Boolean).join(", ") || siteConfig.contact.email;

  let notified = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const alert of firing) {
    const subject = `[${siteConfig.name}] ${severityLabel(alert.severity)}: ${alert.title}`;
    const html = buildEmailHtml(alert);
    try {
      const ok = await sendEmail({
        to,
        subject,
        html,
        templateName: "scheduled_alert",
      });
      if (ok) {
        await db
          .update(scheduledAlerts)
          .set({ notifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(scheduledAlerts.id, alert.id));
        notified++;
      } else {
        errors.push({ id: alert.id, error: "sendEmail returned false" });
      }
    } catch (err) {
      errors.push({ id: alert.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    checked: dateRows.length + invRows.length,
    firing: firing.length,
    notified,
    errors,
  });
}

function severityLabel(s: "info" | "warning" | "critical") {
  if (s === "critical") return "CRITICAL";
  if (s === "warning") return "Warning";
  return "Info";
}

function buildEmailHtml(alert: {
  title: string;
  message: string | null;
  triggerAt: Date | null;
  productName: string | null;
  thresholdQuantity: number | null;
  currentQuantity: number | null;
  severity: "info" | "warning" | "critical";
}) {
  const color = alert.severity === "critical" ? "#EF4444" : alert.severity === "warning" ? "#F59E0B" : "#0EA5E9";
  const rows: string[] = [];
  if (alert.triggerAt) rows.push(`<li><strong>Trigger:</strong> ${new Date(alert.triggerAt).toLocaleString()}</li>`);
  if (alert.productName) rows.push(`<li><strong>Product:</strong> ${alert.productName}</li>`);
  if (alert.thresholdQuantity != null) rows.push(`<li><strong>Threshold:</strong> ${alert.thresholdQuantity}</li>`);
  if (alert.currentQuantity != null) rows.push(`<li><strong>Current stock:</strong> ${alert.currentQuantity}</li>`);

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 540px; margin: 0 auto;">
      <div style="border-left: 4px solid ${color}; padding: 16px 20px; background: #FAFAFA; border-radius: 6px;">
        <h2 style="margin: 0 0 8px; color: #1E1B2E;">${escapeHtml(alert.title)}</h2>
        ${alert.message ? `<p style="color: #6B7280; margin: 0 0 12px;">${escapeHtml(alert.message)}</p>` : ""}
        ${rows.length > 0 ? `<ul style="color: #1E1B2E; padding-left: 20px; margin: 0;">${rows.join("")}</ul>` : ""}
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 16px;">
        Scheduled alert from ${siteConfig.name}. Open the admin to acknowledge.
      </p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
