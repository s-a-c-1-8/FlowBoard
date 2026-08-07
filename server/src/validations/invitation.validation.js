import { z } from "zod";

import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const createInvitationSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase().email("Enter a valid email"),

      role: z.enum(["member", "admin"]).default("member"),
    })
    .strict(),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

export const invitationIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    invitationId: objectIdSchema,
  }),

  query: z.object({}),
});

export const workspaceInvitationIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
    invitationId: objectIdSchema,
  }),

  query: z.object({}),
});

export const getMyInvitationsSchema = z.object({
  body: z.object({}),

  params: z.object({}),

  query: z
    .object({
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

      status: z
        .enum(["pending", "accepted", "rejected", "cancelled", "expired"])
        .optional(),
    })
    .strict(),
});

export const acceptInvitationSchema = z.object({
  body: z.object({}),

  params: z.object({
    invitationId: objectIdSchema,
  }),

  query: z.object({}),
});

export const getWorkspaceInvitationsSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z
    .object({
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

      status: z
        .enum(["pending", "accepted", "rejected", "cancelled", "expired"])
        .optional(),
    })
    .strict(),
});

export const cancelInvitationSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
    invitationId: objectIdSchema,
  }),

  query: z.object({}),
});