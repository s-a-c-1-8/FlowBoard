import { z } from "zod";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.constants.js";
import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const createTaskSchema = z.object({
  body: z
    .object({
      title: z
        .string({
          error: "Task title is required",
        })
        .trim()
        .min(2, "Task title must contain at least 2 characters")
        .max(150, "Task title cannot exceed 150 characters"),

      description: z
        .string()
        .trim()
        .max(2000, "Task description cannot exceed 2000 characters")
        .optional()
        .default(""),

      status: z
        .enum(Object.values(TASK_STATUS))
        .optional()
        .default(TASK_STATUS.TODO),

      priority: z
        .enum(Object.values(TASK_PRIORITY))
        .optional()
        .default(TASK_PRIORITY.MEDIUM),

      assignedTo: objectIdSchema.optional().nullable(),

      dueDate: z.coerce.date().optional().nullable(),

      estimatedHours: z.coerce
        .number()
        .min(0, "Estimated hours cannot be negative")
        .max(10000, "Estimated hours value is too large")
        .optional()
        .nullable(),

      tags: z
        .array(
          z
            .string()
            .trim()
            .min(1, "Tag cannot be empty")
            .max(30, "Tag cannot exceed 30 characters"),
        )
        .max(10, "A task cannot contain more than 10 tags")
        .optional()
        .default([]),
    })
    .strict(),

  params: z.object({
    projectId: objectIdSchema,
  }),

  query: z.object({}),
});

export const getProjectTasksSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    projectId: objectIdSchema,
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

      status: z.enum(Object.values(TASK_STATUS)).optional(),

      priority: z.enum(Object.values(TASK_PRIORITY)).optional(),

      assignedTo: objectIdSchema.optional(),

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
          "title",
          "status",
          "priority",
          "dueDate",
        ])
        .optional()
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    })
    .strict(),
});

export const taskIdSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z.object({}),
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, "Task title must contain at least 2 characters")
        .max(150, "Task title cannot exceed 150 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .max(2000, "Task description cannot exceed 2000 characters")
        .optional(),

      status: z.enum(Object.values(TASK_STATUS)).optional(),

      priority: z.enum(Object.values(TASK_PRIORITY)).optional(),

      assignedTo: objectIdSchema.optional().nullable(),

      dueDate: z.coerce.date().optional().nullable(),

      estimatedHours: z.coerce
        .number()
        .min(0, "Estimated hours cannot be negative")
        .max(10000, "Estimated hours value is too large")
        .optional()
        .nullable(),

      tags: z
        .array(
          z
            .string()
            .trim()
            .min(1, "Tag cannot be empty")
            .max(30, "Tag cannot exceed 30 characters"),
        )
        .max(10, "A task cannot contain more than 10 tags")
        .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z.object({}),
});

export const updateTaskStatusSchema = z.object({
  body: z
    .object({
      status: z.enum(Object.values(TASK_STATUS)),
    })
    .strict(),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z.object({}).optional(),
});

export const updateTaskAssigneeSchema = z.object({
  body: z
    .object({
      assignedTo: objectIdSchema.nullable(),
    })
    .strict(),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z.object({}).optional(),
});