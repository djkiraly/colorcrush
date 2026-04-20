import { z } from "zod";

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
});

export type ProductFormData = z.infer<typeof productSchema>;
