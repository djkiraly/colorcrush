"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface MeResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: string | null;
  hasPassword: boolean;
}

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse | null) => {
        if (cancelled || !data) return;
        setMe(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;

    if (newPassword && newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword && me.hasPassword && !currentPassword) {
      toast.error("Enter your current password to set a new one");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name,
        phone: phone || null,
      };
      if (newPassword) {
        body.newPassword = newPassword;
        if (me.hasPassword) body.currentPassword = currentPassword;
      }

      const res = await fetch("/api/account/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account updated");
        setCurrentPassword("");
        setNewPassword("");
        // Reflect new hasPassword if we just set one
        if (newPassword && me) setMe({ ...me, hasPassword: true });
      } else {
        toast.error(data.error || "Failed to update account");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-brand-text-muted">Failed to load account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-brand-secondary mb-8">
        Account Settings
      </h1>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl p-6 shadow-sm space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={me.email} disabled />
          <p className="text-xs text-brand-text-muted">
            Email is used for login and can&apos;t be changed here.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium mb-1">
            {me.hasPassword ? "Change Password" : "Set a Password"}
          </h3>
          <p className="text-xs text-brand-text-muted mb-4">
            {me.hasPassword
              ? "Leave blank to keep your current password."
              : "Your account currently signs in via Google. Setting a password lets you sign in with email + password too."}
          </p>
          <div className="space-y-4">
            {me.hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
