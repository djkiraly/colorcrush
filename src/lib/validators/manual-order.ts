import { z } from "zod";

const addressFields = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, "Street address required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  zip: z.string().min(1, "ZIP required"),
  country: z.string().default("US"),
});

const customerExisting = z.object({
  mode: z.literal("existing"),
  userId: z.string().uuid(),
});
const customerNew = z.object({
  mode: z.literal("new"),
  email: z.email(),
  name: z.string().min(1, "Name required"),
  phone: z.string().optional(),
});

const addressSaved = z.object({
  mode: z.literal("saved"),
  addressId: z.string().uuid(),
});
const addressInline = addressFields.extend({
  mode: z.literal("inline"),
});

const itemCatalog = z.object({
  kind: z.literal("catalog"),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPriceOverride: z.number().nonnegative().optional(),
});
const itemCustom = z.object({
  kind: z.literal("custom"),
  description: z.string().min(1, "Description required"),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createManualOrderSchema = z.object({
  customer: z.discriminatedUnion("mode", [customerExisting, customerNew]),
  shippingAddress: z.discriminatedUnion("mode", [addressSaved, addressInline]),
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: z.discriminatedUnion("mode", [addressSaved, addressInline]).optional(),
  items: z.array(z.discriminatedUnion("kind", [itemCatalog, itemCustom])).min(1, "Add at least one item"),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  couponCode: z.string().optional(),
  manualDiscount: z
    .object({
      type: z.enum(["fixed", "percent"]),
      value: z.number().nonnegative(),
      reason: z.string().optional(),
    })
    .optional(),
  taxOverride: z.number().nonnegative().optional(),
  giftMessage: z.string().optional(),
  isGift: z.boolean().default(false),
  notes: z.string().optional(),
});

// Edit-draft: customer cannot change, but everything else can.
export const updateManualOrderSchema = createManualOrderSchema.omit({ customer: true });

export type CreateManualOrderInput = z.infer<typeof createManualOrderSchema>;
export type UpdateManualOrderInput = z.infer<typeof updateManualOrderSchema>;
