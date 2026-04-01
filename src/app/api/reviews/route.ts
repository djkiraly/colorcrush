import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, users, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const allReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isApproved: reviews.isApproved,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      adminResponse: reviews.adminResponse,
      createdAt: reviews.createdAt,
      userName: users.name,
      productName: products.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json({ reviews: allReviews });
}
