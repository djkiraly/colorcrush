import { z } from "zod";

// Saved-address create/update payload. Required fields here include the new
// recipientName + phone columns. The DB columns are nullable to keep legacy
// rows compatible, but every NEW write goes through this validator.
export const addressInputSchema = z.object({
  label: z.string().max(50).optional().nullable(),
  recipientName: z.string().min(1, "Recipient name is required").max(255),
  phone: z
    .string()
    .min(7, "Phone is required")
    .max(50)
    .regex(/^[0-9+()\-.\s]+$/, "Phone format looks invalid"),
  line1: z.string().min(1, "Street address required").max(255),
  line2: z.string().max(255).optional().nullable(),
  city: z.string().min(1, "City required").max(100),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().min(5, "ZIP must be at least 5 characters").max(20),
  country: z.literal("US").default("US"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;
