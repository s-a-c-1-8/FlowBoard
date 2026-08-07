import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const emptyBodySchema = z.object({}).optional();

export const emptyParamsSchema = z.object({});

export const emptyQuerySchema = z.object({}).optional();

export const paginationQuerySchema = {
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),
};
