import { NextRequest, NextResponse } from "next/server";
import { getSignedUploadUrl } from "@/lib/gcs";

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, pathPrefix } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    const result = await getSignedUploadUrl(fileName, contentType, pathPrefix || "products");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
