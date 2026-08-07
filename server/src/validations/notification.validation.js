import { z } from "zod";
import { NOTIFICATION_TYPE } from "../constants/notification.constants.js";

export const getMyNotificationsSchema = z.object({
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
        .default(20),

      isRead: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),

      type: z.enum(Object.values(NOTIFICATION_TYPE)).optional(),
    })
    .strict(),
});

import {
  emptyBodySchema,
  emptyQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from "./common.validation.js";

export const markNotificationAsReadSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    notificationId: objectIdSchema,
  }),

  query: z.object({}).optional(),
});

export const deleteNotificationSchema = z.object({
  body: z.object({}).optional(),

  params: z.object({
    notificationId: objectIdSchema,
  }),

  query: z.object({}).optional(),
});

