"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

export function NewsletterSignup() {
  const siteConfig = useSiteSettings();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
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
        />
        <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
