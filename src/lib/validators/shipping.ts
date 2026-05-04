import { z } from "zod";

export const shippingDestinationSchema = z.object({
  street1: z.string().min(1, "Street address required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP must be at least 5 characters"),
  country: z.literal("US"),
});

export const shippingRateRequestSchema = z.object({
  destination: shippingDestinationSchema,
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one item is required"),
});

export type ShippingDestination = z.infer<typeof shippingDestinationSchema>;
export type ShippingRateRequest = z.infer<typeof shippingRateRequestSchema>;
