import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";


export const createWorkspaceSchema = z.object({
  body: z
    .object({
      name: z
        .string({
          error: "Workspace name is required",
        })
        .trim()
        .min(2, "Workspace name must contain at least 2 characters")
        .max(80, "Workspace name cannot exceed 80 characters"),

      description: z
        .string()
        .trim()
        .max(300, "Workspace description cannot exceed 300 characters")
        .optional()
        .default(""),
    })
    .strict(),

  params: z.object({}),
  query: z.object({}),
});

export const workspaceIdSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

export const updateWorkspaceSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Workspace name must contain at least 2 characters")
        .max(80, "Workspace name cannot exceed 80 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .max(300, "Workspace description cannot exceed 300 characters")
        .optional(),
    })
    .strict()
    .refine(
      (data) => data.name !== undefined || data.description !== undefined,
      {
        message: "At least one field must be provided for update",
      },
    ),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

export const addWorkspaceMemberSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          error: "Email is required",
        })
        .trim()
        .toLowerCase()
        .email("Enter a valid email address"),

      role: z.enum(["admin", "member"]).optional().default("member"),
    })
    .strict(),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

export const updateWorkspaceMemberRoleSchema = z.object({
  body: z
    .object({
      role: z.enum(["admin", "member"]),
    })
    .strict(),

  params: z.object({
    workspaceId: objectIdSchema,
    memberId: objectIdSchema,
  }),

  query: z.object({}),
});

export const removeWorkspaceMemberSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
    memberId: objectIdSchema,
  }),

  query: z.object({}),
});

export const leaveWorkspaceSchema = z.object({
  body: z.object({}),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

