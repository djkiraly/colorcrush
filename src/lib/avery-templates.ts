// Avery label-sheet specs (US Letter, 8.5in × 11in, portrait). All values in
// inches. Margins/pitches are verified to sum exactly to the page so the grid
// aligns with the die-cut.
//
// This is a PLAIN module (no "use client") on purpose: the data is consumed by
// both the server label page and the client LabelPrintView component. Runtime
// values exported from a "use client" module become client-reference proxies on
// the server, so the template data must live here, not in the client component.

export type AveryTemplate = {
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

export const PAGE_W = 8.5;
export const PAGE_H = 11;

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
