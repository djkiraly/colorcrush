import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const [category] = await db.insert(categories).values(body).returning();
  return NextResponse.json(category);
}

export async function GET() {
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  return NextResponse.json({ categories: allCategories });
}
