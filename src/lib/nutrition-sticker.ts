/**
 * Composes a printable nutrition QR sticker as an SVG: the product name, the QR
 * code, and a "Scan for Nutrition Info" label, with a thin brand accent bar.
 *
 * The QR itself still encodes only the page URL (see the QR route) — these are
 * presentational additions around it, not encoded data.
 */

/** XML-escape text for safe embedding in SVG markup. */
function escapeXml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] as string
  );
}

/**
 * Greedily wrap a product name into at most `maxLines` lines of roughly
 * `maxChars`, appending an ellipsis if the name is too long to fit.
 */
function wrapName(name: string, maxChars = 24, maxLines = 2): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || current === "") {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/**
 * Build the composite sticker SVG. `qrSvg` is the raw output of
 * `QRCode.toString(..., { type: 'svg' })`; its inner content is nested into the
 * layout so the QR scales to the sticker's QR box.
 */
export function buildNutritionStickerSvg(
  qrSvg: string,
  productName: string
): string {
  const viewBox = qrSvg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 100 100";
  const qrInner = qrSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  const W = 420;
  const pad = 28;
  const accentH = 8;
  const qrSize = 280;
  const qrX = (W - qrSize) / 2;

  const nameLines = wrapName(productName);
  const nameFont = 24;
  const nameLineH = 30;
  const labelFont = 18;

  let y = accentH + pad;

  const nameEls = nameLines.map((line, i) => {
    const ty = y + nameFont + i * nameLineH;
    return `<text x="${W / 2}" y="${ty}" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="${nameFont}" font-weight="700" fill="#1E1B2E">${escapeXml(line)}</text>`;
  });
  y += nameLines.length * nameLineH + 12;

  const qrY = y;
  y += qrSize + 18;

  const labelY = y + labelFont;
  const H = labelY + pad;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="brandAccent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#581C87"/>
      <stop offset="0.5" stop-color="#F9A8D4"/>
      <stop offset="0.78" stop-color="#A7F3D0"/>
      <stop offset="1" stop-color="#FDBA74"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="${accentH}" fill="url(#brandAccent)"/>
  ${nameEls.join("\n  ")}
  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="${viewBox}" shape-rendering="crispEdges">${qrInner}</svg>
  <text x="${W / 2}" y="${labelY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${labelFont}" font-weight="600" fill="#581C87">Scan for Nutrition Info</text>
</svg>`;
}
