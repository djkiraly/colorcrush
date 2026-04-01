import { z } from "zod";

export const couponSchema = z.object({
  code: z.string().min(1, "Code is required").max(50).transform((v) => v.toUpperCase()),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0).nullable().optional(),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
});

export type CouponFormData = z.infer<typeof couponSchema>;
