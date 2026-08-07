import { z } from "zod";

import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const createProjectSchema = z.object({
  body: z
    .object({
      name: z
        .string({
          error: "Project name is required",
        })
        .trim()
        .min(2, "Project name must contain at least 2 characters")
        .max(100, "Project name cannot exceed 100 characters"),

      description: z
        .string()
        .trim()
        .max(500, "Project description cannot exceed 500 characters")
        .optional()
        .default(""),

      status: z
        .enum(["planning", "active", "on-hold", "completed"])
        .optional()
        .default("planning"),

      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .default("medium"),

      startDate: z.coerce.date().optional().nullable(),

      dueDate: z.coerce.date().optional().nullable(),
    })
    .strict()
    .refine(
      (data) => {
        if (!data.startDate || !data.dueDate) {
          return true;
        }

        return data.dueDate >= data.startDate;
      },
      {
        message: "Due date cannot be earlier than start date",
        path: ["dueDate"],
      },
    ),

  params: z.object({
    workspaceId: objectIdSchema,
  }),

  query: z.object({}),
});

export const getWorkspaceProjectsSchema = z.object({
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

      status: z.enum(["planning", "active", "on-hold", "completed"]).optional(),

      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),

      search: z
        .string()
        .trim()
        .max(100, "Search cannot exceed 100 characters")
        .optional(),

      isArchived: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional()
        .default(false),

      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "name",
          "startDate",
          "dueDate",
          "priority",
          "status",
        ])
        .optional()
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    })
    .strict(),
});

export const projectIdSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    projectId: objectIdSchema,
  }),

  query: z.object({}),
});

export const updateProjectSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Project name must contain at least 2 characters")
        .max(100, "Project name cannot exceed 100 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Project description cannot exceed 500 characters")
        .optional(),

      status: z.enum(["planning", "active", "on-hold", "completed"]).optional(),

      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),

      startDate: z.coerce.date().nullable().optional(),

      dueDate: z.coerce.date().nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    })
    .refine(
      (data) => {
        if (!data.startDate || !data.dueDate) {
          return true;
        }

        return data.dueDate >= data.startDate;
      },
      {
        message: "Due date cannot be earlier than start date",
        path: ["dueDate"],
      },
    ),

  params: z.object({
    projectId: objectIdSchema,
  }),

  query: z.object({}),
});