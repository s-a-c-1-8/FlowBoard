import { z } from "zod";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.constants.js";

export const getMyTasksSchema = z.object({
  body: z.object({}).optional(),

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

      status: z.enum(Object.values(TASK_STATUS)).optional(),

      priority: z.enum(Object.values(TASK_PRIORITY)).optional(),

      search: z
        .string()
        .trim()
        .max(100, "Search cannot exceed 100 characters")
        .optional(),

      overdue: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),

      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "title",
          "dueDate",
          "priority",
          "status",
        ])
        .optional()
        .default("dueDate"),

      sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
    })
    .strict(),
});
