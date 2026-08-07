import express from "express";

import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  deleteNotificationSchema,
  getMyNotificationsSchema,
  markNotificationAsReadSchema,
} from "../validations/notification.validation.js";
import { verifyNotificationAccess } from "../middlewares/notification.middleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  validate(getMyNotificationsSchema),
  getMyNotifications,
);

router.patch("/read-all", protect, markAllNotificationsAsRead);

router.patch(
  "/:notificationId/read",
  protect,
  validate(markNotificationAsReadSchema),
  verifyNotificationAccess,
  markNotificationAsRead,
);

router.delete(
  "/:notificationId",
  protect,
  validate(deleteNotificationSchema),
  verifyNotificationAccess,
  deleteNotification,
);
export default router;
