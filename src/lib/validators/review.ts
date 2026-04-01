import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  body: z.string().optional(),
});

export const reviewModerationSchema = z.object({
  isApproved: z.boolean(),
  adminResponse: z.string().optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ReviewModeration = z.infer<typeof reviewModerationSchema>;
