import { describe, expect, it } from "vitest";

import notificationReducer, {
  setNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "../features/notifications/notificationSlice.js";

describe("notificationSlice", () => {
  it("should return the initial state", () => {
    const state = notificationReducer(undefined, {
      type: "unknown",
    });

    expect(state).toEqual({
      notifications: [],
      unreadCount: 0,
    });
  });
  it("should set notifications and calculate unread count", () => {
    const notifications = [
      {
        id: "1",
        title: "Task assigned",
        isRead: false,
      },
      {
        id: "2",
        title: "Task updated",
        isRead: true,
      },
      {
        id: "3",
        title: "New comment",
        isRead: false,
      },
    ];

    const state = notificationReducer(
      undefined,
      setNotifications(notifications),
    );

    expect(state.notifications).toEqual(notifications);
    expect(state.unreadCount).toBe(2);
  });

  it("should mark a notification as read and decrease unread count", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: false,
        },
        {
          id: "2",
          title: "New comment",
          isRead: false,
        },
      ],
      unreadCount: 2,
    };

    const state = notificationReducer(initialState, markAsRead("1"));

    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("should mark a notification as read and decrease unread count", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: false,
        },
        {
          id: "2",
          title: "New comment",
          isRead: false,
        },
      ],
      unreadCount: 2,
    };

    const state = notificationReducer(initialState, markAsRead("1"));

    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("should not decrease unread count if notification is already read", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: true,
        },
        {
          id: "2",
          title: "New comment",
          isRead: false,
        },
      ],
      unreadCount: 1,
    };

    const state = notificationReducer(initialState, markAsRead("1"));

    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("should mark all notifications as read", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: false,
        },
        {
          id: "2",
          title: "New comment",
          isRead: false,
        },
        {
          id: "3",
          title: "Task updated",
          isRead: true,
        },
      ],
      unreadCount: 2,
    };

    const state = notificationReducer(initialState, markAllAsRead());

    expect(
      state.notifications.every((notification) => notification.isRead),
    ).toBe(true);

    expect(state.unreadCount).toBe(0);
  });

  it("should remove a notification", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: true,
        },
        {
          id: "2",
          title: "New comment",
          isRead: false,
        },
      ],
      unreadCount: 1,
    };

    const state = notificationReducer(initialState, removeNotification("1"));

    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe("2");
    expect(state.unreadCount).toBe(1);
  });

  it("should decrease unread count when removing an unread notification", () => {
    const initialState = {
      notifications: [
        {
          id: "1",
          title: "Task assigned",
          isRead: false,
        },
        {
          id: "2",
          title: "Task updated",
          isRead: true,
        },
      ],
      unreadCount: 1,
    };

    const state = notificationReducer(initialState, removeNotification("1"));

    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe("2");
    expect(state.unreadCount).toBe(0);
  });
  
});
