"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NutritionFactsPanel } from "@/components/storefront/NutritionFactsPanel";
import type { LabelModel } from "@/lib/label-model";

export type LabelSize = "2x2" | "3x2" | "4x3";

const SIZE_CONFIG: Record<
  LabelSize,
  { w: number; h: number; fs: number; qrIn: number; label: string }
> = {
  "2x2": { w: 2, h: 2, fs: 1, qrIn: 0.4, label: '2" × 2" (back of bag)' },
  "3x2": { w: 3, h: 2, fs: 1.25, qrIn: 0.55, label: '3" × 2"' },
  "4x3": { w: 4, h: 3, fs: 1.6, qrIn: 0.7, label: '4" × 3"' },
};

// Brand accent gradient (purple → pink → teal → gold) for the thin top rule.
const ACCENT = "linear-gradient(90deg,#581C87,#F9A8D4,#A7F3D0,#FDBA74)";

export function LabelPrintView({
  productId,
  model,
  initialSize,
}: {
  productId: string;
  model: LabelModel;
  initialSize: LabelSize;
}) {
  const router = useRouter();
  const [size, setSize] = useState<LabelSize>(initialSize);
  const cfg = SIZE_CONFIG[size];

  const hasIngredients = model.ingredientsText.trim().length > 0;
  const showPanel = !!model.nutrition;

  // At 2×2 a full FDA panel rarely fits beside the required elements, so the QR
  // is auto-suppressed when the panel is on and the admin is warned.
  const suppressQrForPanel = showPanel && size === "2x2";
  const showQr = !!model.qrUrl && !suppressQrForPanel;

  const pt = (base: number) => `${(base * cfg.fs).toFixed(1)}pt`;

  // Dynamic @page size + print rules for the selected preset.
  const printCss = `
    @page { size: ${cfg.w}in ${cfg.h}in; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .label-no-print { display: none !important; }
      .label-sheet { box-shadow: none !important; border: none !important; }
    }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      {/* ── Toolbar (never prints) ── */}
      <div className="label-no-print mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Print Label
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-brand-text-secondary">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as LabelSize)}
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            {(Object.keys(SIZE_CONFIG) as LabelSize[]).map((s) => (
              <option key={s} value={s}>
                {SIZE_CONFIG[s].label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={!hasIngredients}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            Print
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* ── Advisory warnings (never print) ── */}
      {!hasIngredients ? (
        <div className="label-no-print max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This product has no ingredient text yet — required for a compliant
          label. Add ingredients in the nutrition editor before printing.
        </div>
      ) : (
        <>
          {suppressQrForPanel ? (
            <div className="label-no-print mb-4 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              The Nutrition Facts panel is enabled, so the QR code is hidden to
              save space. A 2″ × 2″ sticker is usually too small for the full
              panel — consider the 4″ × 3″ size for legibility.
            </div>
          ) : null}

          {/* ── The printable sticker ── */}
          <div
            className="label-sheet box-border overflow-hidden border border-gray-300 bg-white text-black shadow-sm"
            style={{
              width: `${cfg.w}in`,
              height: `${cfg.h}in`,
              padding: "0.08in",
              fontFamily: "Arial, Helvetica, sans-serif",
              lineHeight: 1.15,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Thin brand accent rule (only element allowed exact color in print) */}
            <div
              style={{
                height: "3px",
                background: ACCENT,
                marginBottom: "0.04in",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
            />

            {/* 1. Statement of identity — largest type, top */}
            <div
              style={{ fontSize: pt(9), fontWeight: 800, textAlign: "center" }}
            >
              {model.statementOfIdentity}
            </div>

            {/* Optional Nutrition Facts panel (reused from the public page) */}
            {showPanel && model.nutrition ? (
              <div
                style={{
                  margin: "0.04in 0",
                  overflow: "hidden",
                  // Shrink the screen-scaled panel down onto the small label.
                  transform: `scale(${0.18 * cfg.fs})`,
                  transformOrigin: "top left",
                  width: `${(1 / (0.18 * cfg.fs)) * 100}%`,
                }}
              >
                <NutritionFactsPanel nutrition={model.nutrition} />
              </div>
            ) : null}

            {/* 2. Ingredients — smallest legible size, fills the middle */}
            <div
              style={{
                fontSize: pt(5),
                marginTop: "0.04in",
                flex: "1 1 auto",
                overflow: "hidden",
              }}
            >
              <span style={{ fontWeight: 700 }}>Ingredients: </span>
              {model.ingredientsText}
            </div>

            {/* 3. Contains — bold, immediately after ingredients */}
            {model.containsStatement ? (
              <div style={{ fontSize: pt(5), fontWeight: 700, marginTop: "0.02in" }}>
                {model.containsStatement}
              </div>
            ) : null}

            {/* 4. Cross-contact advisory — separate, lighter/italic */}
            {model.crossContactNote ? (
              <div
                style={{
                  fontSize: pt(4.5),
                  fontStyle: "italic",
                  color: "#333",
                  marginTop: "0.02in",
                }}
              >
                {model.crossContactNote}
              </div>
            ) : null}

            {/* Bottom block: net weight + distributed-by on the left, QR right */}
            <div
              style={{
                marginTop: "0.04in",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "0.06in",
              }}
            >
              <div style={{ minWidth: 0 }}>
                {model.netWeightLine ? (
                  <div style={{ fontSize: pt(6.5), fontWeight: 700 }}>
                    {model.netWeightLine}
                  </div>
                ) : null}
                <div style={{ fontSize: pt(4), color: "#222" }}>
                  {model.distributedBy}
                </div>
              </div>
              {showQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/admin/products/${productId}/qr?format=svg&bare=1&download=0`}
                  alt="Nutrition page QR code"
                  style={{
                    width: `${cfg.qrIn}in`,
                    height: `${cfg.qrIn}in`,
                    flexShrink: 0,
                  }}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
