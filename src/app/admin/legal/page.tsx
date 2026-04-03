"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AdminLegalPage() {
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTerms, setSavingTerms] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setTerms((data.overrides?.termsAndConditions as string) || "");
        setPrivacy((data.overrides?.privacyPolicy as string) || "");
      } catch {
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  const saveContent = async (key: string, value: string, setSaving: (v: boolean) => void) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        toast.success("Saved successfully");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-secondary">
          Legal Pages
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Edit the Terms and Conditions and Privacy Policy displayed on your storefront.
        </p>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* Terms and Conditions */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-semibold text-lg">Terms and Conditions</h2>
              <p className="text-xs text-brand-text-muted mt-1">
                Displayed at <code className="bg-gray-100 px-1 rounded">/terms-and-conditions</code>
              </p>
            </div>
          </div>
          <RichTextEditor value={terms} onChange={setTerms} placeholder="Enter your terms and conditions..." />
          <div className="mt-4">
            <Button
              onClick={() => saveContent("termsAndConditions", terms, setSavingTerms)}
              disabled={savingTerms}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingTerms ? "Saving..." : "Save Terms"}
            </Button>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-semibold text-lg">Privacy Policy</h2>
              <p className="text-xs text-brand-text-muted mt-1">
                Displayed at <code className="bg-gray-100 px-1 rounded">/privacy-policy</code>
              </p>
            </div>
          </div>
          <RichTextEditor value={privacy} onChange={setPrivacy} placeholder="Enter your privacy policy..." />
          <div className="mt-4">
            <Button
              onClick={() => saveContent("privacyPolicy", privacy, setSavingPrivacy)}
              disabled={savingPrivacy}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingPrivacy ? "Saving..." : "Save Privacy Policy"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
