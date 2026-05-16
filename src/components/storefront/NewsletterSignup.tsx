"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { toast } from "sonner";

export function NewsletterSignup() {
  const siteConfig = useSiteSettings();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't subscribe — try again");
        return;
      }
      if (data.alreadySubscribed) {
        toast.success("You're already on the list!");
      } else if (data.resubscribed) {
        toast.success("Welcome back — you're resubscribed");
      } else {
        toast.success("You're on the list!");
      }
      setSubmitted(true);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <h3 className="text-2xl font-heading font-bold text-white mb-2">
          You&apos;re on the list!
        </h3>
        <p className="text-white/80">
          Thanks for subscribing. Sweet deals coming your way soon.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="text-2xl font-heading font-bold text-white mb-2">
        Stay Sweet
      </h3>
      <p className="text-white/80 mb-6 max-w-md mx-auto">
        Join the {siteConfig.name} family for exclusive deals, new product alerts,
        and a 10% off welcome coupon.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white"
          disabled={submitting}
        />
        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6"
        >
          {submitting ? "..." : "Subscribe"}
        </Button>
      </form>
    </div>
  );
}
