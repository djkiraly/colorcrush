"use client";

import { useEffect, useState } from "react";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { Skeleton } from "@/components/ui/skeleton";

export default function TermsAndConditionsPage() {
  const siteConfig = useSiteSettings();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages/terms-and-conditions")
      .then((r) => r.json())
      .then((d) => setContent(d.content || ""))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-heading font-bold text-brand-secondary mb-8">
        Terms and Conditions
      </h1>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : content ? (
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p className="text-brand-text-muted italic">
          Terms and conditions have not been published yet.
        </p>
      )}
    </div>
  );
}
