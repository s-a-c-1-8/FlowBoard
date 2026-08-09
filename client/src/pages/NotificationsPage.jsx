import { useEffect, useState } from "react";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../features/notifications/notificationService.js";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";

import { useDispatch, useSelector } from "react-redux";

import {
  setNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "../features/notifications/notificationSlice.js";

const NotificationsPage = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(
    (state) => state.notifications.notifications,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getNotifications();

        dispatch(setNotifications(response.data.notifications || []));
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to load notifications",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return <p>Loading notifications...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      setError("");

      await markNotificationAsRead(notificationId);

      dispatch(markAsRead(notificationId));
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to mark notification as read",
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setError("");

      await markAllNotificationsAsRead();

      dispatch(markAllAsRead());
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to mark notifications as read",
      );
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      setError("");

      await deleteNotification(notificationId);

      dispatch(removeNotification(notificationId));
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete notification",
      );
    }
  };
  
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on task assignments and activity that needs your attention."
        action={
          notifications.some((notification) => !notification.isRead) ? (
            <Button variant="secondary" onClick={handleMarkAllAsRead}>
              <span className="flex items-center gap-2">
                <CheckCheck size={16} />
                Mark All as Read
              </span>
            </Button>
          ) : null
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Bell size={22} />
            </div>

            <h3 className="font-semibold text-slate-900">No notifications</h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              You're all caught up. New task assignments and updates will appear
              here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={
                !notification.isRead ? "border-indigo-200 bg-indigo-50/30" : ""
              }
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <Bell size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-semibold text-slate-900">
                        {notification.title}
                      </h3>

                      <Badge
                        variant={notification.isRead ? "default" : "primary"}
                      >
                        {notification.isRead ? "Read" : "Unread"}
                      </Badge>
                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
                  {!notification.isRead && (
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
