import { z } from "zod";

// ═══ PRODUCT OPTIONS ═══

export const optionTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type OptionTypeFormData = z.infer<typeof optionTypeSchema>;

export const optionValueSchema = z.object({
  optionTypeId: z.string().uuid(),
  value: z.string().min(1, "Value is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  code: z
    .string()
    .min(1, "Short code is required")
    .max(8, "Short code must be 8 chars or fewer")
    .regex(/^[A-Z0-9]+$/, "Code must be uppercase letters and digits only"),
  swatchHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6,8}$/, "Must be a hex color like #1E40AF")
    .nullable()
    .optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type OptionValueFormData = z.infer<typeof optionValueSchema>;

// ═══ PRODUCT VARIANTS ═══

export const variantSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  optionValueIds: z.array(z.string().uuid()).min(1, "Pick at least one option"),
  priceOverride: z.coerce.number().positive().nullable().optional(),
  compareAtPriceOverride: z.coerce.number().positive().nullable().optional(),
  weightOzOverride: z.coerce.number().int().nonnegative().nullable().optional(),
  weight: z.coerce.number().positive().nullable().optional(),
  imageOverrideId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type VariantFormData = z.infer<typeof variantSchema>;

export const variantMatrixRequestSchema = z.object({
  optionValueIdsByType: z.record(z.string().uuid(), z.array(z.string().uuid())),
});

export type VariantMatrixRequest = z.infer<typeof variantMatrixRequestSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  costPrice: z.coerce.number().positive().nullable().optional(),
  sku: z.string().min(1, "SKU is required").max(100),
  barcode: z.string().max(100).optional(),
  weight: z.coerce.number().positive().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isGiftEligible: z.boolean().default(true),
  allergens: z.array(z.string()).optional(),
  ingredients: z.string().optional(),
  nutritionInfo: z.record(z.string(), z.unknown()).nullable().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  hasVariants: z.boolean().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
