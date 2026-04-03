import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, isAdmin } from "@/lib/auth-helpers";
import { generateProductContent } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prompt, productName, categoryName } = await request.json();

  if (!prompt || !productName) {
    return NextResponse.json(
      { error: "prompt and productName are required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateProductContent(prompt, productName, categoryName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed" },
      { status: 500 }
    );
  }
}
