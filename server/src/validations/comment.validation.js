import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const createCommentSchema = z.object({
  body: z
    .object({
      content: z
        .string({
          error: "Comment content is required",
        })
        .trim()
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment cannot exceed 2000 characters"),
    })
    .strict(),

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z.object({}),
});

export const getTaskCommentsSchema = z.object({
  body: emptyBodySchema,

  params: z.object({
    taskId: objectIdSchema,
  }),

  query: z
    .object({
      ...paginationQuerySchema,

      sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
    })
    .strict(),
});

export const updateCommentSchema = z.object({
  body: z
    .object({
      content: z
        .string({
          error: "Comment content is required",
        })
        .trim()
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment cannot exceed 2000 characters"),
    })
    .strict(),

  params: z.object({
    commentId: objectIdSchema,
  }),

  query: z.object({}),
});

export const deleteCommentSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    commentId: objectIdSchema,
  }),

  query: z.object({}),
});