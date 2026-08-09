import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationsPage from "../pages/NotificationsPage.jsx";
import notificationReducer from "../features/notifications/notificationSlice.js";

vi.mock("../features/notifications/notificationService.js", () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../features/notifications/notificationService.js";

describe("NotificationsPage", () => {
  it("should load and render notifications", async () => {
    getNotifications.mockResolvedValue({
      data: {
        notifications: [
          {
            id: "notification-1",
            title: "Task assigned to you",
            message: 'Sachin assigned you the task "React Update"',
            isRead: false,
            createdAt: "2026-08-09T10:00:00.000Z",
          },
          {
            id: "notification-2",
            title: "Task updated",
            message: "Task status was changed",
            isRead: true,
            createdAt: "2026-08-09T11:00:00.000Z",
          },
        ],
      },
    });

    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    render(
      <Provider store={store}>
        <NotificationsPage />
      </Provider>,
    );

    expect(await screen.findByText("Task assigned to you")).toBeInTheDocument();

    expect(screen.getByText("Task updated")).toBeInTheDocument();

    expect(store.getState().notifications.notifications).toHaveLength(2);

    expect(store.getState().notifications.unreadCount).toBe(1);
  });

  it("should mark a notification as read", async () => {
    const user = userEvent.setup();

    getNotifications.mockResolvedValue({
      data: {
        notifications: [
          {
            id: "notification-1",
            title: "Task assigned to you",
            message: 'You were assigned the task "React Update"',
            isRead: false,
            createdAt: "2026-08-09T10:00:00.000Z",
          },
        ],
      },
    });

    markNotificationAsRead.mockResolvedValue({
      data: {
        notification: {
          id: "notification-1",
          isRead: true,
        },
      },
    });

    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    render(
      <Provider store={store}>
        <NotificationsPage />
      </Provider>,
    );

    await screen.findByText("Task assigned to you");

    expect(store.getState().notifications.unreadCount).toBe(1);

    await user.click(
      screen.getByRole("button", {
        name: /mark as read/i,
      }),
    );

    expect(markNotificationAsRead).toHaveBeenCalledWith("notification-1");

    expect(store.getState().notifications.unreadCount).toBe(0);

    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  it("should delete a notification", async () => {
    const user = userEvent.setup();

    getNotifications.mockResolvedValue({
      data: {
        notifications: [
          {
            id: "notification-1",
            title: "Task assigned to you",
            message: "You were assigned a task",
            isRead: true,
            createdAt: "2026-08-09T10:00:00.000Z",
          },
        ],
      },
    });

    deleteNotification.mockResolvedValue({
      data: {
        message: "Notification deleted",
      },
    });

    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    render(
      <Provider store={store}>
        <NotificationsPage />
      </Provider>,
    );

    await screen.findByText("Task assigned to you");

    expect(store.getState().notifications.notifications).toHaveLength(1);

    await user.click(
      screen.getByRole("button", {
        name: /delete notification/i,
      }),
    );

    expect(deleteNotification).toHaveBeenCalledWith("notification-1");

    expect(store.getState().notifications.notifications).toHaveLength(0);

    expect(screen.queryByText("Task assigned to you")).not.toBeInTheDocument();

    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it("should mark all notifications as read", async () => {
    const user = userEvent.setup();

    getNotifications.mockResolvedValue({
      data: {
        notifications: [
          {
            id: "notification-1",
            title: "Task assigned",
            message: "You were assigned a task",
            isRead: false,
            createdAt: "2026-08-09T10:00:00.000Z",
          },
          {
            id: "notification-2",
            title: "New comment",
            message: "Someone commented on your task",
            isRead: false,
            createdAt: "2026-08-09T11:00:00.000Z",
          },
        ],
      },
    });

    markAllNotificationsAsRead.mockResolvedValue({
      data: {
        message: "All notifications marked as read",
      },
    });

    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    render(
      <Provider store={store}>
        <NotificationsPage />
      </Provider>,
    );

    await screen.findByText("Task assigned");

    expect(store.getState().notifications.unreadCount).toBe(2);

    await user.click(
      screen.getByRole("button", {
        name: /mark all as read/i,
      }),
    );

    expect(markAllNotificationsAsRead).toHaveBeenCalled();

    expect(store.getState().notifications.unreadCount).toBe(0);

    expect(
      screen.queryByRole("button", {
        name: /mark all as read/i,
      }),
    ).not.toBeInTheDocument();
  });
});
