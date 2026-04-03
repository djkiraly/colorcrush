"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const currentRole = (session?.user as { role?: string })?.role;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "super_admin",
    phone: "",
    password: "",
  });
  const [createdAt, setCreatedAt] = useState("");
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    if (currentRole && currentRole !== "super_admin") {
      router.replace("/admin");
      return;
    }
    async function fetchStaff() {
      const res = await fetch(`/api/staff/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone || "",
          password: "",
        });
        setCreatedAt(data.createdAt);
        setIsSelf(data.id === (session?.user as { id?: string })?.id);
      }
      setLoading(false);
    }
    if (currentRole === "super_admin") fetchStaff();
  }, [params.id, currentRole, router, session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone || undefined,
          password: form.password || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Staff member updated");
        setForm((f) => ({ ...f, password: "" }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("This will revoke admin access for this user. They will become a regular customer. Continue?")) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/staff/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Access revoked");
        router.push("/admin/staff");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke access");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRevoking(false);
    }
  };

  if (currentRole && currentRole !== "super_admin") return null;
  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-secondary">
            {form.name}
          </h1>
          <p className="text-sm text-brand-text-muted">
            Joined {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge
          className={
            form.role === "super_admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }
        >
          {form.role === "super_admin" ? "Super Admin" : "Admin"}
        </Badge>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as "admin" | "super_admin",
                })
              }
              disabled={isSelf}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            {isSelf && (
              <p className="text-xs text-brand-text-muted">
                You cannot change your own role.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Reset Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Leave blank to keep current"
              minLength={8}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          {!isSelf && (
            <Button
              type="button"
              variant="outline"
              className="ml-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleRevoke}
              disabled={revoking}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {revoking ? "Revoking..." : "Revoke Access"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
