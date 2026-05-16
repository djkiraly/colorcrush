"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Loader2,
  Send,
  Trash2,
  Mail,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  htmlBody: string;
  status: "draft" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
};

type Subscriber = {
  id: string;
  email: string;
  isActive: boolean;
  source: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export default function NewsletterAdminPage() {
  const [activeTab, setActiveTab] = useState("compose");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [counts, setCounts] = useState({ active: 0, total: 0 });
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Composer state
  const [form, setForm] = useState({
    name: "",
    subject: "",
    preheader: "",
    htmlBody: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/admin/newsletter/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers");
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setCounts(data.counts || { active: 0, total: 0 });
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchSubscribers();
  }, []);

  const resetComposer = () => {
    setForm({ name: "", subject: "", preheader: "", htmlBody: "" });
    setEditingId(null);
  };

  const loadIntoComposer = (c: Campaign) => {
    setForm({
      name: c.name,
      subject: c.subject,
      preheader: c.preheader ?? "",
      htmlBody: c.htmlBody,
    });
    setEditingId(c.status === "draft" ? c.id : null);
    setActiveTab("compose");
    if (c.status !== "draft") {
      toast.info("Loaded as a new draft — sent campaigns can't be edited in place");
    }
  };

  const saveDraft = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      toast.error("Name, subject, and body are required");
      return;
    }
    setSavingDraft(true);
    try {
      const url = editingId
        ? `/api/admin/newsletter/campaigns/${editingId}`
        : "/api/admin/newsletter/campaigns";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }
      toast.success(editingId ? "Draft updated" : "Draft saved");
      if (!editingId && data.campaign?.id) {
        setEditingId(data.campaign.id);
      }
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingDraft(false);
    }
  };

  const sendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a test email address");
      return;
    }
    let campaignId = editingId;
    if (!campaignId) {
      // Need to save first
      await saveDraft();
      campaignId = editingId;
      // saveDraft sets editingId; re-read latest
    }
    if (!campaignId) {
      toast.error("Save the draft before sending a test");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaignId}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testEmail: testEmail.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.sent === false) {
        throw new Error(data.error || "Test send failed");
      }
      toast.success(`Test sent to ${testEmail.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setSendingTest(false);
    }
  };

  const sendCampaign = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlBody.trim()) {
      toast.error("Name, subject, and body are required");
      return;
    }
    if (
      !confirm(
        `Send "${form.subject}" to all ${counts.active} active subscriber(s)? This cannot be undone.`
      )
    )
      return;
    setSending(true);
    try {
      let campaignId = editingId;
      if (!campaignId) {
        const saveRes = await fetch("/api/admin/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || "Save failed");
        campaignId = saveData.campaign.id;
        setEditingId(campaignId);
      }
      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaignId}/send`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Send failed");
      }
      toast.success(
        `Sent ${data.sentCount} of ${data.recipientCount}${
          data.failedCount > 0 ? ` · ${data.failedCount} failed` : ""
        }`
      );
      resetComposer();
      setActiveTab("campaigns");
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const deleteDraft = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      toast.success("Draft deleted");
      if (editingId === id) resetComposer();
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const removeSubscriber = async (id: string) => {
    if (!confirm("Mark this subscriber inactive?")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Subscriber removed");
      fetchSubscribers();
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            Newsletter
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            {counts.active.toLocaleString()} active subscriber
            {counts.active === 1 ? "" : "s"} · {counts.total.toLocaleString()} total
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="compose" className="px-4">
            <Plus className="h-4 w-4 mr-1.5" /> Compose
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="px-4">
            <Mail className="h-4 w-4 mr-1.5" /> Campaigns
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="px-4">
            <Users className="h-4 w-4 mr-1.5" /> Subscribers
          </TabsTrigger>
        </TabsList>

        {/* COMPOSE */}
        <TabsContent value="compose">
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4 mt-6 max-w-3xl">
            {editingId && (
              <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                <span>Editing draft</span>
                <button
                  type="button"
                  onClick={resetComposer}
                  className="text-brand-primary hover:underline"
                >
                  Start a new one
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Internal name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Spring Launch · v2"
              />
              <p className="text-xs text-brand-text-muted">
                Only visible to you — for the campaigns list.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Subject line</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Fresh batches just dropped 🍬"
              />
            </div>
            <div className="space-y-2">
              <Label>Preheader (optional)</Label>
              <Input
                value={form.preheader}
                onChange={(e) => setForm({ ...form, preheader: e.target.value })}
                placeholder="Short preview shown next to the subject in inboxes"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <RichTextEditor
                value={form.htmlBody}
                onChange={(v) => setForm({ ...form, htmlBody: v })}
                placeholder="Write your newsletter…"
              />
              <p className="text-xs text-brand-text-muted">
                Wrapped in the site email template (logo, brand colors, footer
                with unsubscribe link) when sent.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3 pt-3 border-t">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={savingDraft || sending}
              >
                {savingDraft ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? "Save changes" : "Save draft"}
              </Button>

              <div className="flex items-end gap-2">
                <div>
                  <Label className="text-xs">Test send to</Label>
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 w-56"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={sendTest}
                  disabled={sendingTest || sending}
                >
                  {sendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Send Test
                </Button>
              </div>

              <div className="ml-auto">
                <Button
                  onClick={sendCampaign}
                  disabled={sending || counts.active === 0}
                  className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to {counts.active.toLocaleString()} subscriber
                  {counts.active === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns">
          <div className="bg-white rounded-xl shadow-sm border mt-6 divide-y">
            {loadingCampaigns ? (
              <div className="py-12 text-center text-brand-text-muted">
                <Loader2 className="h-5 w-5 inline animate-spin mr-2" />
                Loading…
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-12 text-center text-brand-text-muted">
                No campaigns yet. Start one in the Compose tab.
              </div>
            ) : (
              campaigns.map((c) => {
                const expanded = expandedCampaign === c.id;
                const statusColor =
                  c.status === "sent"
                    ? "bg-green-100 text-green-800"
                    : c.status === "sending"
                    ? "bg-yellow-100 text-yellow-800"
                    : c.status === "failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700";
                return (
                  <div key={c.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{c.name}</span>
                          <Badge className={statusColor}>{c.status}</Badge>
                        </div>
                        <p className="text-sm text-brand-text-secondary truncate">
                          {c.subject}
                        </p>
                        <p className="text-xs text-brand-text-muted mt-1">
                          {c.status === "sent" || c.status === "sending"
                            ? `${c.sentCount}/${c.recipientCount} sent${
                                c.failedCount > 0 ? ` · ${c.failedCount} failed` : ""
                              }${
                                c.sentAt
                                  ? ` · ${new Date(c.sentAt).toLocaleString()}`
                                  : ""
                              }`
                            : `Created ${new Date(c.createdAt).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadIntoComposer(c)}
                        >
                          {c.status === "draft" ? "Edit" : "Duplicate"}
                        </Button>
                        {c.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDraft(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-brand-error" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExpandedCampaign(expanded ? null : c.id)
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {expanded && (
                      <div
                        className="mt-3 border rounded-lg bg-gray-50 p-4 text-sm prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: c.htmlBody }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* SUBSCRIBERS */}
        <TabsContent value="subscribers">
          <div className="bg-white rounded-xl shadow-sm border mt-6 overflow-hidden">
            {loadingSubscribers ? (
              <div className="py-12 text-center text-brand-text-muted">
                <Loader2 className="h-5 w-5 inline animate-spin mr-2" />
                Loading…
              </div>
            ) : subscribers.length === 0 ? (
              <div className="py-12 text-center text-brand-text-muted">
                No subscribers yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-xs uppercase tracking-wide text-brand-text-muted">
                  <tr>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Source</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Subscribed</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscribers.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2">{s.email}</td>
                      <td className="px-4 py-2 text-brand-text-muted">
                        {s.source || "—"}
                      </td>
                      <td className="px-4 py-2">
                        {s.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unsubscribed</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-brand-text-muted">
                        {new Date(s.subscribedAt).toLocaleDateString()}
                      </td>
                      <td className="px-2">
                        {s.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubscriber(s.id)}
                            title="Remove (mark inactive)"
                          >
                            <Trash2 className="h-4 w-4 text-brand-error" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
