import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional(),
  role: z.enum(["customer", "admin", "super_admin"]).default("customer"),
});

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1, "Address is required").max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zip: z.string().min(1, "ZIP code is required").max(20),
  country: z.string().default("US"),
  isDefault: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
