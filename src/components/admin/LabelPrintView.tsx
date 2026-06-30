"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NutritionFactsPanel } from "@/components/storefront/NutritionFactsPanel";
import type { LabelModel } from "@/lib/label-model";

// ── Avery template specs (US Letter, 8.5in × 11in, portrait) ──
// All values in inches. Margins/pitches verified to sum exactly to the page so
// the grid aligns with the die-cut. Still: do a calibration test print before
// committing a full run — printer scaling can shift everything.
type AveryTemplate = {
  id: string;
  name: string;
  labelW: number;
  labelH: number;
  cols: number;
  rows: number;
  marginTop: number; // top margin to first row
  marginLeft: number; // left margin to first column
  colPitch: number; // left-edge to left-edge, adjacent columns
  rowPitch: number; // top-edge to top-edge, adjacent rows
};

const PAGE_W = 8.5;
const PAGE_H = 11;

export const AVERY_TEMPLATES = {
  "22806": {
    id: "22806",
    name: 'Avery 22806 — 2"×2" square (12/sheet)',
    labelW: 2,
    labelH: 2,
    cols: 3,
    rows: 4,
    marginTop: 0.6,
    marginLeft: 0.625,
    colPitch: 2.625, // 2.0 label + 0.625 gap
    rowPitch: 2.6, // 2.0 label + 0.6 gap
  },
  "5163": {
    id: "5163",
    name: 'Avery 5163 — 2"×4" (10/sheet)',
    labelW: 4,
    labelH: 2,
    cols: 2,
    rows: 5,
    marginTop: 0.5,
    marginLeft: 0.15625,
    colPitch: 4.1875, // 4.0 label + 0.1875 gap
    rowPitch: 2.0, // no vertical gap
  },
  "5164": {
    id: "5164",
    name: 'Avery 5164 — 3⅓"×4" (6/sheet)',
    labelW: 4,
    labelH: 3.3333,
    cols: 2,
    rows: 3,
    marginTop: 0.5,
    marginLeft: 0.15625,
    colPitch: 4.1875,
    rowPitch: 3.3333, // no vertical gap
  },
  "5160": {
    id: "5160",
    name: 'Avery 5160 — 1"×2⅝" (30/sheet)',
    labelW: 2.625,
    labelH: 1,
    cols: 3,
    rows: 10,
    marginTop: 0.5,
    marginLeft: 0.1875,
    colPitch: 2.75, // 2.625 label + 0.125 gap
    rowPitch: 1.0, // no vertical gap
  },
} satisfies Record<string, AveryTemplate>;

export type AveryTemplateId = keyof typeof AVERY_TEMPLATES;
export const AVERY_TEMPLATE_IDS = Object.keys(
  AVERY_TEMPLATES
) as AveryTemplateId[];

// Brand accent gradient (purple → pink → teal → gold) for the thin top rule.
const ACCENT = "linear-gradient(90deg,#581C87,#F9A8D4,#A7F3D0,#FDBA74)";

/** A single label's content, scaled to its physical size via `fs`. */
function LabelContent({
  model,
  qrSvg,
  fs,
  qrIn,
  showQr,
  showPanel,
}: {
  model: LabelModel;
  qrSvg: string | null;
  fs: number;
  qrIn: number;
  showQr: boolean;
  showPanel: boolean;
}) {
  const pt = (base: number) => `${(base * fs).toFixed(1)}pt`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "0.06in",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.12,
        color: "#000",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Thin brand accent rule (only element allowed exact color in print) */}
      <div
        style={{
          height: "3px",
          background: ACCENT,
          marginBottom: "0.03in",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      />

      {/* 1. Statement of identity */}
      <div style={{ fontSize: pt(9), fontWeight: 800, textAlign: "center" }}>
        {model.statementOfIdentity}
      </div>

      {/* Optional Nutrition Facts panel (reused, scaled onto the label) */}
      {showPanel && model.nutrition ? (
        <div
          style={{
            margin: "0.03in 0",
            overflow: "hidden",
            transform: `scale(${0.18 * fs})`,
            transformOrigin: "top left",
            width: `${(1 / (0.18 * fs)) * 100}%`,
          }}
        >
          <NutritionFactsPanel nutrition={model.nutrition} />
        </div>
      ) : null}

      {/* 2. Ingredients — fills the middle */}
      <div
        style={{
          fontSize: pt(5),
          marginTop: "0.03in",
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

      {/* Net weight + distributed-by on the left, QR on the right */}
      <div
        style={{
          marginTop: "0.03in",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "0.05in",
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
        {showQr && qrSvg ? (
          <div
            className="[&>svg]:h-full [&>svg]:w-full"
            style={{ width: `${qrIn}in`, height: `${qrIn}in`, flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function LabelPrintView({
  model,
  qrSvg,
  initialTemplate,
}: {
  model: LabelModel;
  qrSvg: string | null;
  initialTemplate: AveryTemplateId;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<AveryTemplateId>(initialTemplate);
  const t = AVERY_TEMPLATES[templateId];

  const hasIngredients = model.ingredientsText.trim().length > 0;
  const showPanel = !!model.nutrition;

  // Font scale relative to the 2"-tall reference label.
  const fs = t.labelH / 2;

  // Small labels can't fit the panel; suppress QR + warn when the panel is on.
  const tooSmallForPanel = showPanel && t.labelH < 3;
  const showQr = !!model.qrUrl && !tooSmallForPanel;
  const qrIn = Math.min(Math.max(0.4 * fs, 0.3), 0.75);

  const tooSmallForContent = t.labelH < 1.5;
  const perSheet = t.cols * t.rows;
  const cells = Array.from({ length: perSheet });

  const printCss = `
    @page { size: ${PAGE_W}in ${PAGE_H}in; margin: 0; }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
        background: #fff !important;
      }
      body * { visibility: hidden !important; }
      .label-sheet, .label-sheet * { visibility: visible !important; }
      .label-no-print { display: none !important; }
      .label-sheet {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .label-cell { border: none !important; }
    }
  `;

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      {/* ── Header (never prints) ── */}
      <div className="label-no-print mb-4 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold text-brand-secondary">
          Print Label
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="ml-auto"
        >
          Back
        </Button>
      </div>

      {!hasIngredients ? (
        <div className="label-no-print max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          This product has no ingredient text yet — required for a compliant
          label. Add ingredients in the nutrition editor before printing.
        </div>
      ) : (
        <>
          {/* ── Warnings (never print) ── */}
          {tooSmallForPanel ? (
            <div className="label-no-print mb-3 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              The Nutrition Facts panel is enabled, so the QR code is hidden to
              save space — and this label size is likely too small for the full
              panel. Use Avery 5164 (3⅓″×4″) for the panel.
            </div>
          ) : null}
          {tooSmallForContent ? (
            <div className="label-no-print mb-3 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              This Avery size is very small — the ingredient list may be
              illegible or clipped. Consider a larger template.
            </div>
          ) : null}

          {/* ── Print controls, kept right next to the label ── */}
          <div className="label-no-print mb-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-brand-secondary text-white hover:opacity-90"
            >
              Print ({perSheet} per sheet)
            </Button>
            <label className="text-sm text-brand-text-secondary">
              Avery template
            </label>
            <select
              value={templateId}
              onChange={(e) =>
                setTemplateId(e.target.value as AveryTemplateId)
              }
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              {AVERY_TEMPLATE_IDS.map((id) => (
                <option key={id} value={id}>
                  {AVERY_TEMPLATES[id].name}
                </option>
              ))}
            </select>
          </div>

          {/* ── The full Letter sheet, tiled with the max count ── */}
          <div
            className="label-sheet relative border border-gray-300 bg-white shadow-sm"
            style={{ width: `${PAGE_W}in`, height: `${PAGE_H}in` }}
          >
            {cells.map((_, i) => {
              const col = i % t.cols;
              const row = Math.floor(i / t.cols);
              return (
                <div
                  key={i}
                  className="label-cell absolute overflow-hidden border border-dashed border-gray-200"
                  style={{
                    left: `${t.marginLeft + col * t.colPitch}in`,
                    top: `${t.marginTop + row * t.rowPitch}in`,
                    width: `${t.labelW}in`,
                    height: `${t.labelH}in`,
                  }}
                >
                  <LabelContent
                    model={model}
                    qrSvg={qrSvg}
                    fs={fs}
                    qrIn={qrIn}
                    showQr={showQr}
                    showPanel={showPanel}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
