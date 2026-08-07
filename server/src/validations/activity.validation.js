import { z } from "zod";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.constants.js";
import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const getTaskActivitiesSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z
    .object({
      ...paginationQuerySchema,

      status: z.enum(Object.values(TASK_STATUS)).optional(),

      priority: z.enum(Object.values(TASK_PRIORITY)).optional(),

      assignedTo: objectIdSchema.optional(),

      search: z.string().trim().max(100).optional(),

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
