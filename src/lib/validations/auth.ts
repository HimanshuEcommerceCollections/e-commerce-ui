import { z } from "zod";

// ─── Login ─────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Signup (customer) ───────────────────────────────────────────────────────
export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(200, "Full name must not exceed 200 characters"),
    email: z.email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, "You must accept the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

