import {
  getMyNotificationsService,
  markAllNotificationsAsReadService,
  markNotificationAsReadService,
  deleteNotificationService,
} from "../services/notification.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await getMyNotificationsService({
    userId: req.user._id,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications retrieved successfully"));
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationAsReadService({
    notification: req.notification,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { notification },
        "Notification marked as read successfully",
      ),
    );
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsAsReadService({
    userId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "All notifications marked as read successfully",
      ),
    );
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await deleteNotificationService({
    notification: req.notification,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notification deleted successfully"));
});