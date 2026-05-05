import { db } from "@/lib/db";
import { scheduledAlerts, users } from "@/lib/db/schema";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { sendEmail } from "@/lib/gmail";
import { emailLayout, loadEmailSettings } from "@/lib/email-templates/base";
import { getSettings } from "@/lib/settings";

type Severity = "info" | "warning" | "critical";

interface RecordOptions {
  severity?: Severity;
  title: string;
  message: string;
  /**
   * Suppress duplicate alerts with the same title raised within this many ms.
   * Default: 30 minutes. Prevents alert storms while a flaky upstream is
   * actively failing.
   */
  dedupeWindowMs?: number;
  /** Email admins as well as creating the dashboard alert. Default true. */
  notifyAdmins?: boolean;
}

const DEFAULT_DEDUPE_MS = 30 * 60 * 1000;

/**
 * Record a system-level alert in the dashboard and (optionally) email admins.
 *
 * - Writes a `scheduled_alerts` row with `type='system'` so the existing
 *   admin alerts UI surfaces it.
 * - Dedupes against any unacknowledged alert with the same title raised
 *   recently — repeated upstream failures don't spam the dashboard.
 * - Looks up active admin/super_admin emails and sends a single email with
 *   the alert details.
 *
 * Designed to be called from a `catch` block. Never throws — any failure
 * here is logged and swallowed so it doesn't mask the original error.
 */
export async function recordSystemAlert({
  severity = "warning",
  title,
  message,
  dedupeWindowMs = DEFAULT_DEDUPE_MS,
  notifyAdmins = true,
}: RecordOptions): Promise<void> {
  try {
    const since = new Date(Date.now() - dedupeWindowMs);

    const [recent] = await db
      .select({ id: scheduledAlerts.id })
      .from(scheduledAlerts)
      .where(
        and(
          eq(scheduledAlerts.type, "system"),
          eq(scheduledAlerts.title, title),
          eq(scheduledAlerts.isAcknowledged, false),
          gt(scheduledAlerts.createdAt, since)
        )
      )
      .orderBy(desc(scheduledAlerts.createdAt))
      .limit(1);

    if (recent) return; // dedupe — recent identical alert is still open

    const [inserted] = await db
      .insert(scheduledAlerts)
      .values({
        type: "system",
        severity,
        title,
        message,
        triggerAt: null,
      })
      .returning({ id: scheduledAlerts.id });

    if (!notifyAdmins) return;

    const adminRows = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.role, ["admin", "super_admin"]));

    if (adminRows.length === 0) return;

    const settings = await getSettings();
    const html = await renderAlertEmail({ severity, title, message });

    // Mark as notified before fanning out so transient SMTP errors don't loop.
    await db
      .update(scheduledAlerts)
      .set({ notifiedAt: new Date() })
      .where(eq(scheduledAlerts.id, inserted.id));

    const subject = `[${settings.name}] ${severity.toUpperCase()} — ${title}`;

    await Promise.all(
      adminRows.map((admin) =>
        sendEmail({
          to: admin.email,
          subject,
          html,
          templateName: "system-alert",
        }).catch(() => {})
      )
    );
  } catch (err) {
    console.error("[system-alerts] recordSystemAlert failed:", err);
  }
}

async function renderAlertEmail({
  severity,
  title,
  message,
}: {
  severity: Severity;
  title: string;
  message: string;
}): Promise<string> {
  const s = await loadEmailSettings();
  const color =
    severity === "critical"
      ? "#DC2626"
      : severity === "warning"
        ? "#F59E0B"
        : s.colors.secondary;

  return emailLayout(
    s,
    `
    <h2 style="margin:0 0 16px;font-family:'Poppins',Arial,sans-serif;color:${color};font-size:22px;">
      ${severity.toUpperCase()}: ${escapeHtml(title)}
    </h2>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">
      A system alert was raised on ${escapeHtml(s.name)}. Details below.
    </p>
    <pre style="background-color:#F3F4F6;border-radius:8px;padding:16px;font-family:'Menlo',monospace;font-size:13px;color:#1E1B2E;white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</pre>
    <p style="color:#9CA3AF;font-size:12px;margin-top:24px;">
      View and acknowledge in the <a href="${s.url}/admin" style="color:${s.colors.primary};">admin dashboard</a>.
    </p>
    `,
    `${severity.toUpperCase()} alert — ${title}`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
