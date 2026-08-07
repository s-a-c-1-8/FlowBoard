import Notification from "../models/notification.model.js";
import { createPaginationMeta, getPagination } from "../utils/pagination.js";

export const createNotificationService = async ({
  recipient,
  sender = null,
  workspace = null,
  project = null,
  task = null,
  type,
  title,
  message,
  metadata = {},
  session = null,
}) => {
  const notificationData = {
    recipient,
    sender,
    workspace,
    project,
    task,
    type,
    title,
    message,
    metadata,
  };

  if (session) {
    const [notification] = await Notification.create([notificationData], {
      session,
    });

    return notification;
  }

  return Notification.create(notificationData);
};

export const getMyNotificationsService = async ({ userId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    recipient: userId,
  };

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate({
        path: "sender",
        select: "name email",
      })
      .populate({
        path: "workspace",
        select: "name",
      })
      .populate({
        path: "project",
        select: "name",
      })
      .populate({
        path: "task",
        select: "title status priority",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      recipient: userId,
      isRead: false,
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};

export const markNotificationAsReadService = async ({ notification }) => {
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();
  }

  return notification;
};

export const markAllNotificationsAsReadService = async ({ userId }) => {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

export const deleteNotificationService = async ({ notification }) => {
  await notification.deleteOne();

  return {
    notificationId: notification._id,
  };
};