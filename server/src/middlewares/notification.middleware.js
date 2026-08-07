import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyNotificationAccess = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to access this notification",
    );
  }

  req.notification = notification;

  next();
});
