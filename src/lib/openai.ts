import OpenAI from "openai";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;

async function getApiKey(): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "openai"))
      .limit(1);
    if (row?.value) {
      const val = row.value as { apiKey?: string };
      if (val.apiKey) return val.apiKey;
    }
  } catch {}
  return process.env.OPENAI_API_KEY || "";
}

async function getClient(): Promise<OpenAI> {
  const key = await getApiKey();
  if (!key) throw new Error("OpenAI API key not configured");
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedClient = new OpenAI({ apiKey: key });
  cachedKey = key;
  return cachedClient;
}

export function invalidateOpenAIClient(): void {
  cachedClient = null;
  cachedKey = null;
}

export interface GeneratedProductContent {
  description: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  allergens: string[];
}

export async function generateProductContent(
  prompt: string,
  productName: string,
  categoryName?: string
): Promise<GeneratedProductContent> {
  const client = await getClient();

  const systemPrompt = `You are a product copywriter for an online candy and confectionery store. Write engaging, appetizing product descriptions that drive sales. Be specific about flavors, textures, and occasions.

You MUST return a JSON object with ALL of these fields populated — none may be empty strings or omitted:
- description (string): A detailed 2-3 paragraph product description using HTML formatting (use <p>, <strong>, <em>, <u> tags for structure and emphasis).
- shortDescription (string): A single sentence summary (under 120 characters).
- metaTitle (string, REQUIRED, 30-60 characters): SEO-optimized page title. Include the product name. Never return an empty string.
- metaDescription (string, REQUIRED, 120-155 characters): Compelling SEO meta description that summarizes the product and entices clicks. Never return an empty string.
- tags (string[]): Relevant product tags (e.g. "bestseller", "vegan", "gluten-free", "gift"). Empty array is allowed only if truly nothing applies.
- allergens (string[]): Allergens detectable from the description (e.g. "milk", "soy", "tree nuts", "wheat"). Empty array is allowed if none apply.

Return ONLY valid JSON, no markdown fences or extra text.`;

  const userPrompt = `Product name: ${productName}${categoryName ? `\nCategory: ${categoryName}` : ""}

Staff notes: ${prompt}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    // JSON mode forces valid JSON output — avoids markdown-fence parsing drift.
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from OpenAI");

  // Strip markdown fences if present (JSON mode shouldn't add them, but be defensive)
  const cleaned = content.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  const description = typeof parsed.description === "string" ? parsed.description : "";
  const shortDescription =
    typeof parsed.shortDescription === "string" ? parsed.shortDescription : "";

  // Fallback: if the model omits or empties the SEO fields, derive sensible
  // defaults from the product name / short description so the form is never
  // overwritten with empty strings.
  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const clamp = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

  const rawMetaTitle = typeof parsed.metaTitle === "string" ? parsed.metaTitle.trim() : "";
  const metaTitle = rawMetaTitle || clamp(productName, 60);

  const rawMetaDescription =
    typeof parsed.metaDescription === "string" ? parsed.metaDescription.trim() : "";
  const fallbackMetaDescription =
    shortDescription || stripHtml(description) || `Shop ${productName} online.`;
  const metaDescription = rawMetaDescription || clamp(fallbackMetaDescription, 155);

  return {
    description,
    shortDescription,
    metaTitle,
    metaDescription,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
  };
}

export async function testOpenAIConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getClient();
    await client.models.list();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
