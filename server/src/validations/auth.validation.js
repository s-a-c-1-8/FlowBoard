import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({
          error: "Name is required",
        })
        .trim()
        .min(2, "Name must contain at least 2 characters")
        .max(50, "Name cannot exceed 50 characters"),

      email: z
        .string({
          error: "Email is required",
        })
        .trim()
        .toLowerCase()
        .email("Enter a valid email address"),

      password: passwordSchema,
    })
    .strict(),

  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          error: "Email is required",
        })
        .trim()
        .toLowerCase()
        .email("Enter a valid email address"),

      password: z
        .string({
          error: "Password is required",
        })
        .min(1, "Password is required"),
    })
    .strict(),

  params: z.object({}),
  query: z.object({}),
});
