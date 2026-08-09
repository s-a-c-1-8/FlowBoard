import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,

  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;

      state.unreadCount = action.payload.filter(
        (notification) => !notification.isRead,
      ).length;
    },

    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (item) => item.id === action.payload,
      );

      if (notification && !notification.isRead) {
        notification.isRead = true;

        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });

      state.unreadCount = 0;
    },

    removeNotification: (state, action) => {
      const notification = state.notifications.find(
        (item) => item.id === action.payload,
      );

      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }

      state.notifications = state.notifications.filter(
        (item) => item.id !== action.payload,
      );
    },
  },
});

export const {
  setNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
