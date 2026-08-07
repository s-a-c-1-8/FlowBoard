import request from "supertest";
import app from "../src/app.js";

import Notification from "../src/models/notification.model.js";

import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";
import { createProject } from "./helpers/project.helper.js";
import { createTask } from "./helpers/task.helper.js";
import { assignTaskToUser } from "./helpers/notification.helper.js";

describe("Notification API", () => {
  let owner;
  let member;
  let workspace;
  let project;
  let task;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Notification Owner",
    });

    member = await registerUser({
      name: "Notification Member",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
      workspace: {
        name: "Notification Workspace",
      },
    });

    workspace = workspaceSetup.workspace;

    const addMemberResponse = await request(app)
      .post(`/api/workspaces/${workspace.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        email: member.user.email,
        role: "member",
      });

    expect(addMemberResponse.statusCode).toBe(201);

    const projectSetup = await createProject({
      token: owner.token,
      workspaceId: workspace.id,
      project: {
        name: "Notification Project",
      },
    });

    project = projectSetup.project;

    const taskSetup = await createTask({
      token: owner.token,
      projectId: project.id,
      task: {
        title: "Notification Test Task",
      },
    });

    task = taskSetup.task;
  });

  const createTaskNotification = async () => {
    const response = await assignTaskToUser({
      token: owner.token,
      taskId: task.id,
      userId: member.user.id,
    });

    expect(response.statusCode).toBe(200);

    return Notification.findOne({
      recipient: member.user.id,
      task: task.id,
      type: "task-assigned",
    });
  };

  describe("GET /api/notifications", () => {
    it("should return notifications belonging to the logged-in user", async () => {
      await createTaskNotification();

      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(1);

      expect(response.body.data.notifications[0]).toEqual(
        expect.objectContaining({
          type: "task-assigned",
          title: "Task assigned to you",
          isRead: false,
        }),
      );
    });

    it("should return unread notification count", async () => {
      await createTaskNotification();

      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.unreadCount).toBe(1);
    });

    it("should not return another user's notifications", async () => {
      await createTaskNotification();

      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toHaveLength(0);
      expect(response.body.data.unreadCount).toBe(0);
    });

    it("should filter notifications by read status", async () => {
      const notification = await createTaskNotification();

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      const response = await request(app)
        .get("/api/notifications?isRead=true")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].isRead).toBe(true);
    });

    it("should filter notifications by type", async () => {
      await createTaskNotification();

      const response = await request(app)
        .get("/api/notifications?type=task-assigned")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0].type).toBe("task-assigned");
    });

    it("should paginate notifications", async () => {
      await createTaskNotification();

      const secondTaskSetup = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Second Notification Task",
        },
      });

      await assignTaskToUser({
        token: owner.token,
        taskId: secondTaskSetup.task.id,
        userId: member.user.id,
      });

      const response = await request(app)
        .get("/api/notifications?page=1&limit=1")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toHaveLength(1);

      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2,
        }),
      );
    });

    it("should reject notification listing without authentication", async () => {
      const response = await request(app).get("/api/notifications");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  describe("PATCH /api/notifications/:notificationId/read", () => {
    it("should mark a notification as read", async () => {
      const notification = await createTaskNotification();

      const response = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.notification.isRead).toBe(true);
      expect(response.body.data.notification.readAt).not.toBeNull();
    });

    it("should return success when notification is already read", async () => {
      const notification = await createTaskNotification();

      const firstResponse = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(firstResponse.statusCode).toBe(200);

      const firstReadAt = firstResponse.body.data.notification.readAt;

      const response = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.isRead).toBe(true);
      expect(response.body.data.notification.readAt).toBe(firstReadAt);
    });

    it("should reject another user's notification", async () => {
      const notification = await createTaskNotification();

      const response = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid notification id", async () => {
      const response = await request(app)
        .patch("/api/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(400);
    });

    it("should reject without authentication", async () => {
      const notification = await createTaskNotification();

      const response = await request(app).patch(
        `/api/notifications/${notification.id}/read`,
      );

      expect(response.statusCode).toBe(401);
    });
  });
  
  describe("PATCH /api/notifications/read-all", () => {
    it("should mark every notification as read", async () => {
      await createTaskNotification();

      const secondTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Second Task",
        },
      });

      await assignTaskToUser({
        token: owner.token,
        taskId: secondTask.task.id,
        userId: member.user.id,
      });

      const response = await request(app)
        .patch("/api/notifications/read-all")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const unread = await Notification.countDocuments({
        recipient: member.user.id,
        isRead: false,
      });

      expect(unread).toBe(0);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).patch("/api/notifications/read-all");

      expect(response.statusCode).toBe(401);
    });
  });

  describe("DELETE /api/notifications/:notificationId", () => {
    it("should delete a notification", async () => {
      const notification = await createTaskNotification();

      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const exists = await Notification.findById(notification.id);

      expect(exists).toBeNull();
    });

    it("should reject deleting another user's notification", async () => {
      const notification = await createTaskNotification();

      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid notification id", async () => {
      const response = await request(app)
        .delete("/api/notifications/invalid-id")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(400);
    });

    it("should reject without authentication", async () => {
      const notification = await createTaskNotification();

      const response = await request(app).delete(
        `/api/notifications/${notification.id}`,
      );

      expect(response.statusCode).toBe(401);
    });
  });
  
});
