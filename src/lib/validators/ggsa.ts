import { z } from "zod";

// Team Sweet Bag order — shared by the client form and the checkout API.
// Flavor is single-select; quantity is a positive integer (min 1).
export const ggsaFlavorSchema = z.enum(["sour", "sweet", "mixed"]);

export const ggsaOrderSchema = z.object({
  flavor: ggsaFlavorSchema,
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Order at least 1 bag")
    .max(500, "For orders over 500, please contact us directly"),
  contactName: z.string().min(1, "Contact name is required").max(255),
  email: z.string().min(1, "Email is required").email("Enter a valid email").max(255),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .max(50)
    .regex(/^[0-9+()\-.\s]+$/, "Phone format looks invalid"),
});

export type GgsaFlavor = z.infer<typeof ggsaFlavorSchema>;
export type GgsaOrderInput = z.infer<typeof ggsaOrderSchema>;

// $3.00 per 3 oz Team Sweet Bag.
export const GGSA_UNIT_PRICE_CENTS = 300;

export const GGSA_FLAVOR_LABELS: Record<GgsaFlavor, string> = {
  sour: "Sour",
  sweet: "Sweet",
  mixed: "Mixed",
};
