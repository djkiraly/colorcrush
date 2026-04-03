import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/gcs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.sortOrder);
  return NextResponse.json(images);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Enforce max 10 images
  const existing = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id));

  if (existing.length >= 10) {
    return NextResponse.json(
      { error: "Maximum of 10 images per product" },
      { status: 400 }
    );
  }

  const isPrimary = existing.length === 0;

  const [image] = await db
    .insert(productImages)
    .values({
      productId: id,
      url: body.url,
      gcsPath: body.gcsPath || null,
      altText: body.altText || null,
      sortOrder: existing.length,
      isPrimary,
    })
    .returning();

  return NextResponse.json(image);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Bulk update: reorder and set primary
  if (Array.isArray(body)) {
    for (const item of body) {
      await db
        .update(productImages)
        .set({
          sortOrder: item.sortOrder,
          isPrimary: item.isPrimary ?? false,
          altText: item.altText,
        })
        .where(
          and(
            eq(productImages.id, item.id),
            eq(productImages.productId, id)
          )
        );
    }
    const updated = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Expected array" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { imageId } = await request.json();

  const [image] = await db
    .select()
    .from(productImages)
    .where(
      and(eq(productImages.id, imageId), eq(productImages.productId, id))
    );

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Delete from GCS if applicable
  if (image.gcsPath) {
    try {
      await deleteFile(image.gcsPath);
    } catch {
      // Continue with DB deletion even if GCS fails
    }
  }

  await db.delete(productImages).where(eq(productImages.id, imageId));

  // If deleted image was primary, promote the first remaining image
  if (image.isPrimary) {
    const remaining = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder)
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, remaining[0].id));
    }
  }

  return NextResponse.json({ success: true });
}
