import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { absoluteUrl } from "@/lib/site-url";
import { buildNutritionStickerSvg } from "@/lib/nutrition-sticker";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * On-demand QR sticker for a product's public nutrition page.
 *
 * IMPORTANT: the QR encodes the page URL, NOT the nutrition data itself. This
 * is deliberate — printed stickers stay valid even when the nutrition text is
 * later corrected, because the URL never changes. Do not "optimize" this into
 * encoding the raw nutrition values.
 *
 * `?format=svg` returns scalable vector (best for print); `?format=png`
 * returns a high-resolution raster for label software. Generated per request —
 * no image files are stored.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format =
    request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  // Attachment download by default; pass ?download=0 for an inline preview.
  const inline = request.nextUrl.searchParams.get("download") === "0";

  const [product] = await db
    .select({ slug: products.slug, name: products.name })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const target = absoluteUrl(`/products/${product.slug}/nutrition`);
  const filename = `${product.slug}-nutrition-qr.${format}`;
  const disposition = `${inline ? "inline" : "attachment"}; filename="${filename}"`;

  // Compose the printable sticker: product name + QR + "Nutrition Info" label.
  const qrSvg = await QRCode.toString(target, { type: "svg", margin: 1 });
  const stickerSvg = buildNutritionStickerSvg(qrSvg, product.name);

  if (format === "png") {
    // Rasterize the vector sticker at high density, then size to ~1024px wide
    // for label software that wants raster.
    const buffer = await sharp(Buffer.from(stickerSvg), { density: 288 })
      .resize({ width: 1024 })
      .png()
      .toBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(stickerSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
