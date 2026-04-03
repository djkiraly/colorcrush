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

Return a JSON object with these exact fields:
- description: A detailed 2-3 paragraph product description using HTML formatting (use <p>, <strong>, <em>, <u> tags for structure and emphasis)
- shortDescription: A single sentence summary (under 120 characters)
- metaTitle: SEO-optimized page title (under 60 characters)
- metaDescription: SEO meta description (under 155 characters)
- tags: An array of relevant product tags (e.g. "bestseller", "vegan", "gluten-free", "gift")
- allergens: An array of allergens if detectable from the description (e.g. "milk", "soy", "tree nuts", "wheat")

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
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from OpenAI");

  // Strip markdown fences if present
  const cleaned = content.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    description: parsed.description || "",
    shortDescription: parsed.shortDescription || "",
    metaTitle: parsed.metaTitle || "",
    metaDescription: parsed.metaDescription || "",
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
