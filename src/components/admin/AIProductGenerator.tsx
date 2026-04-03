"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2, Check } from "lucide-react";

interface GeneratedContent {
  description: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  allergens: string[];
}

interface AIProductGeneratorProps {
  productName: string;
  categoryName?: string;
  onApply: (content: GeneratedContent) => void;
}

export function AIProductGenerator({
  productName,
  categoryName,
  onApply,
}: AIProductGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !productName.trim()) {
      toast.error("Enter a product name and description prompt first");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, productName, categoryName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    toast.success("AI content applied to form fields");
    setOpen(false);
    setResult(null);
    setPrompt("");
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </Button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-heading font-semibold text-purple-900">
            AI Product Writer
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
        >
          Close
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-purple-800">
          Describe the product in your own words
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Rich dark chocolate truffles with a creamy ganache center, dusted with cocoa powder. Made with 72% cacao. Great for gifting. Contains milk and soy."
          rows={3}
          className="bg-white"
        />
        <p className="text-xs text-purple-600">
          The AI will generate a full description, short description, SEO meta
          fields, tags, and allergens based on your notes.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim() || !productName.trim()}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </>
        )}
      </Button>

      {!productName.trim() && (
        <p className="text-xs text-red-500">
          Enter a product name above before generating.
        </p>
      )}

      {result && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h4 className="font-medium text-sm text-purple-800">
            Preview — Review before applying
          </h4>

          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-brand-text-muted">
                Short Description
              </span>
              <p className="text-sm bg-gray-50 rounded p-2">
                {result.shortDescription}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-brand-text-muted">
                Full Description
              </span>
              <p className="text-sm bg-gray-50 rounded p-2 whitespace-pre-wrap">
                {result.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-medium text-brand-text-muted">
                  Meta Title
                </span>
                <p className="text-sm bg-gray-50 rounded p-2">
                  {result.metaTitle}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-text-muted">
                  Meta Description
                </span>
                <p className="text-sm bg-gray-50 rounded p-2">
                  {result.metaDescription}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-medium text-brand-text-muted">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-brand-text-muted">
                  Allergens
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.allergens.length > 0 ? (
                    result.allergens.map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-brand-text-muted">None detected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply to Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
