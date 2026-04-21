"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Bell, Trash2, Check, AlertCircle, AlertTriangle, CalendarDays, Package } from "lucide-react";
import { toast } from "sonner";

type Alert = {
  id: string;
  type: "date" | "inventory";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string | null;
  triggerAt: string | null;
  productId: string | null;
  productName: string | null;
  thresholdQuantity: number | null;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
};

type Product = { id: string; name: string };

type HolidayPreset = { label: string; nextDate: () => Date };

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number) {
  const firstOfMonth = new Date(year, month, 1);
  const offset = (weekday - firstOfMonth.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function nextOccurrenceOf(fn: (year: number) => Date): Date {
  const today = new Date();
  const thisYear = fn(today.getFullYear());
  if (thisYear > today) return thisYear;
  return fn(today.getFullYear() + 1);
}

const HOLIDAY_PRESETS: HolidayPreset[] = [
  { label: "Valentine's Day", nextDate: () => nextOccurrenceOf((y) => new Date(y, 1, 14)) },
  { label: "Easter (approx)", nextDate: () => nextOccurrenceOf((y) => new Date(y, 3, 15)) },
  { label: "Mother's Day (2nd Sun May)", nextDate: () => nextOccurrenceOf((y) => nthWeekdayOfMonth(y, 4, 0, 2)) },
  { label: "Father's Day (3rd Sun June)", nextDate: () => nextOccurrenceOf((y) => nthWeekdayOfMonth(y, 5, 0, 3)) },
  { label: "Halloween", nextDate: () => nextOccurrenceOf((y) => new Date(y, 9, 31)) },
  { label: "Thanksgiving (4th Thu Nov)", nextDate: () => nextOccurrenceOf((y) => nthWeekdayOfMonth(y, 10, 4, 4)) },
  { label: "Christmas", nextDate: () => nextOccurrenceOf((y) => new Date(y, 11, 25)) },
];

function formatLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: "date" as "date" | "inventory",
    severity: "info" as "info" | "warning" | "critical",
    title: "",
    message: "",
    triggerAt: "",
    productId: "",
    thresholdQuantity: "",
  });
  const [leadDays, setLeadDays] = useState("60");
  const [selectedHoliday, setSelectedHoliday] = useState<string>("");

  const fetchAll = async () => {
    const [alertsRes, productsRes] = await Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/products?limit=500&includeInactive=true").then((r) => r.json()),
    ]);
    setAlerts(alertsRes.alerts || []);
    setProducts((productsRes.products || []).map((p: Product) => ({ id: p.id, name: p.name })));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const applyHolidayPreset = (label: string) => {
    setSelectedHoliday(label);
    const preset = HOLIDAY_PRESETS.find((h) => h.label === label);
    if (!preset) return;
    const target = preset.nextDate();
    const lead = parseInt(leadDays) || 0;
    const triggerDate = new Date(target.getTime() - lead * 24 * 60 * 60 * 1000);
    setForm((f) => ({
      ...f,
      triggerAt: formatLocalDateTime(triggerDate),
      title: f.title || `${lead} days before ${label}`,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      type: form.type,
      severity: form.severity,
      title: form.title,
      message: form.message || null,
    };
    if (form.type === "date") {
      if (!form.triggerAt) {
        toast.error("Pick a date/time for this alert");
        return;
      }
      body.triggerAt = new Date(form.triggerAt).toISOString();
    } else {
      if (!form.productId || !form.thresholdQuantity) {
        toast.error("Pick a product and threshold");
        return;
      }
      body.productId = form.productId;
      body.thresholdQuantity = parseInt(form.thresholdQuantity);
    }
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success("Alert scheduled");
      setDialogOpen(false);
      setForm({ type: "date", severity: "info", title: "", message: "", triggerAt: "", productId: "", thresholdQuantity: "" });
      setSelectedHoliday("");
      fetchAll();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error || "Failed to create alert");
    }
  };

  const acknowledge = async (id: string, isAck: boolean) => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAcknowledged: !isAck }),
    });
    if (res.ok) fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) fetchAll();
  };

  const severityBadge = (s: Alert["severity"]) => {
    if (s === "critical") return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
    if (s === "warning") return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
    return <Badge className="bg-sky-100 text-sky-800">Info</Badge>;
  };

  const active = useMemo(() => alerts.filter((a) => !a.isAcknowledged), [alerts]);
  const acknowledged = useMemo(() => alerts.filter((a) => a.isAcknowledged), [alerts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary flex items-center gap-2">
          <Bell className="h-6 w-6" /> Alerts
        </h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> New Alert
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted mb-3">
          Scheduled / Active ({active.length})
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {active.length === 0 ? (
            <div className="p-6 text-sm text-brand-text-muted">No scheduled alerts.</div>
          ) : (
            active.map((a) => <AlertRow key={a.id} a={a} onAck={acknowledge} onRemove={remove} severityBadge={severityBadge} />)
          )}
        </div>
      </section>

      {acknowledged.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted mb-3">
            Acknowledged ({acknowledged.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 opacity-60">
            {acknowledged.map((a) => (
              <AlertRow key={a.id} a={a} onAck={acknowledge} onRemove={remove} severityBadge={severityBadge} />
            ))}
          </div>
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Alert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "date" }))}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm ${
                  form.type === "date" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"
                }`}
              >
                <CalendarDays className="h-4 w-4" /> Date-based
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "inventory" }))}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm ${
                  form.type === "inventory" ? "border-brand-primary bg-brand-primary/5" : "border-gray-200"
                }`}
              >
                <Package className="h-4 w-4" /> Inventory-based
              </button>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={form.type === "date" ? "e.g., 60 days before Mother's Day" : "e.g., Chocolate bars running low"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={2}
                placeholder="Notes for whoever sees this alert"
              />
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as Alert["severity"] })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {form.type === "date" ? (
              <>
                <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                  <Label className="text-xs uppercase tracking-wide text-brand-text-muted">Holiday Preset</Label>
                  <div className="flex gap-2">
                    <select
                      value={selectedHoliday}
                      onChange={(e) => setSelectedHoliday(e.target.value)}
                      className="flex-1 h-9 px-2 rounded-md border border-input bg-white text-sm"
                    >
                      <option value="">— None —</option>
                      {HOLIDAY_PRESETS.map((h) => (
                        <option key={h.label} value={h.label}>
                          {h.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="0"
                      value={leadDays}
                      onChange={(e) => setLeadDays(e.target.value)}
                      className="w-20"
                      placeholder="Lead"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => selectedHoliday && applyHolidayPreset(selectedHoliday)}
                      disabled={!selectedHoliday}
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-brand-text-muted">
                    Sets trigger date to N days before the next occurrence of the holiday.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Trigger Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.triggerAt}
                    onChange={(e) => setForm({ ...form, triggerAt: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Product</Label>
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    required
                  >
                    <option value="">— Select a product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fire when stock is at or below</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.thresholdQuantity}
                    onChange={(e) => setForm({ ...form, thresholdQuantity: e.target.value })}
                    placeholder="20"
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white">
              Schedule Alert
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertRow({
  a,
  onAck,
  onRemove,
  severityBadge,
}: {
  a: Alert;
  onAck: (id: string, isAck: boolean) => void;
  onRemove: (id: string) => void;
  severityBadge: (s: Alert["severity"]) => React.ReactNode;
}) {
  const isFiring =
    !a.isAcknowledged &&
    ((a.type === "date" && a.triggerAt && new Date(a.triggerAt) <= new Date()) ||
      (a.type === "inventory" && a.productName));
  return (
    <div className="flex items-start gap-3 p-4">
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
          a.severity === "critical"
            ? "bg-red-100 text-red-700"
            : a.severity === "warning"
            ? "bg-amber-100 text-amber-700"
            : "bg-sky-100 text-sky-700"
        }`}
      >
        {a.severity === "critical" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{a.title}</span>
          {severityBadge(a.severity)}
          {isFiring && <Badge className="bg-brand-primary/10 text-brand-primary">Firing</Badge>}
        </div>
        {a.message && <p className="text-xs text-brand-text-secondary mt-1">{a.message}</p>}
        <p className="text-xs text-brand-text-muted mt-1">
          {a.type === "date" && a.triggerAt ? `Fires ${new Date(a.triggerAt).toLocaleString()}` : null}
          {a.type === "inventory"
            ? `${a.productName ?? "(product missing)"} — at/below ${a.thresholdQuantity}`
            : null}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAck(a.id, a.isAcknowledged)}
          title={a.isAcknowledged ? "Mark as unread" : "Acknowledge"}
        >
          <Check className={`h-4 w-4 ${a.isAcknowledged ? "text-green-600" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(a.id)} title="Delete">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
