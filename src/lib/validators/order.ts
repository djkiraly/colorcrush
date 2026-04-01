import { z } from "zod";

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Cart is empty"),
  shippingAddressId: z.string().uuid().optional(),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().default("US"),
  }).optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  couponCode: z.string().optional(),
  giftMessage: z.string().optional(),
  isGift: z.boolean().default(false),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
  cancelReason: z.string().optional(),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusSchema>;
