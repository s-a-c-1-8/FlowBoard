import { jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";

import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";
import { createProject } from "./helpers/project.helper.js";
import { createTask } from "./helpers/task.helper.js";
import { createComment } from "./helpers/comment.helper.js";
import { assignTaskToUser } from "./helpers/notification.helper.js";
jest.setTimeout(30000);
describe("Dashboard API", () => {
  let owner;
  let member;
  let workspace;
  let project;
  let task;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Dashboard Owner",
    });

    member = await registerUser({
      name: "Dashboard Member",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
    });

    workspace = workspaceSetup.workspace;

    await request(app)
      .post(`/api/workspaces/${workspace.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        email: member.user.email,
        role: "member",
      });

    const projectSetup = await createProject({
      token: owner.token,
      workspaceId: workspace.id,
    });

    project = projectSetup.project;

    const taskSetup = await createTask({
      token: owner.token,
      projectId: project.id,
    });

    task = taskSetup.task;
  });

  describe("GET /api/dashboard/summary", () => {
    it("should return the correct dashboard summary", async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      const nextWeek = new Date();
      nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

      // Existing task from beforeEach is a todo task.

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Completed Dashboard Task",
          status: "done",
          priority: "medium",
          dueDate: nextWeek.toISOString(),
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Overdue Dashboard Task",
          status: "in-progress",
          priority: "urgent",
          dueDate: yesterday.toISOString(),
        },
      });

      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.summary).toEqual(
        expect.objectContaining({
          workspaceCount: 1,
          projectCount: 1,
          taskCount: 3,
          completedTasks: 1,
          pendingTasks: 2,
          overdueTasks: 1,
          unreadNotifications: 0,
        }),
      );

      expect(
        response.body.data.summary.completedTasks +
          response.body.data.summary.pendingTasks,
      ).toBe(response.body.data.summary.taskCount);
    });

    it("should include the logged-in user's unread notification count", async () => {
      const assignmentResponse = await assignTaskToUser({
        token: owner.token,
        taskId: task.id,
        userId: member.user.id,
      });

      expect(assignmentResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.summary).toEqual(
        expect.objectContaining({
          workspaceCount: 1,
          projectCount: 1,
          taskCount: 1,
          unreadNotifications: 1,
        }),
      );
    });

    it("should exclude archived tasks from the summary", async () => {
      const archivedTaskSetup = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Dashboard Task",
        },
      });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${archivedTaskSetup.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      // Only the original task created in beforeEach is counted.
      expect(response.body.data.summary.taskCount).toBe(1);
    });

    it("should not count resources from inaccessible workspaces", async () => {
      const stranger = await registerUser({
        name: "Dashboard Stranger",
      });

      const response = await request(app)
        .get("/api/dashboard/summary")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.summary).toEqual(
        expect.objectContaining({
          workspaceCount: 0,
          projectCount: 0,
          taskCount: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          unreadNotifications: 0,
        }),
      );
    });

    it("should reject dashboard summary without authentication", async () => {
      const response = await request(app).get("/api/dashboard/summary");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/task-status", () => {
    beforeEach(async () => {
      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Todo Task",
          status: "todo",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Progress Task",
          status: "in-progress",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Review Task",
          status: "in-review",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Done Task",
          status: "done",
        },
      });
    });

    it("should return task status statistics", async () => {
      const response = await request(app)
        .get("/api/dashboard/task-status")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const statistics = response.body.data.statistics;

      expect(statistics).toEqual(
        expect.objectContaining({
          todo: 2,
          "in-progress": 1,
          "in-review": 1,
          done: 1,
          blocked: 0,
        }),
      );

      const total = Object.values(statistics).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(total).toBe(5);
    });

    it("should contain every supported task status", async () => {
      const response = await request(app)
        .get("/api/dashboard/task-status")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.body.data.statistics).toEqual(
        expect.objectContaining({
          todo: expect.any(Number),
          "in-progress": expect.any(Number),
          "in-review": expect.any(Number),
          done: expect.any(Number),
          blocked: expect.any(Number),
        }),
      );
    });

    it("should ignore archived tasks", async () => {
      const archived = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Status Task",
          status: "todo",
        },
      });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${archived.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/task-status")
        .set("Authorization", `Bearer ${owner.token}`);

      const statistics = response.body.data.statistics;

      const total = Object.values(statistics).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(total).toBe(5);
      expect(statistics.todo).toBe(2);
    });

    it("should return zero counts for a user with no workspaces", async () => {
      const stranger = await registerUser({
        name: "Dashboard Stranger",
      });

      const response = await request(app)
        .get("/api/dashboard/task-status")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.statistics).toEqual({
        todo: 0,
        "in-progress": 0,
        "in-review": 0,
        done: 0,
        blocked: 0,
      });
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get("/api/dashboard/task-status");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/task-priority", () => {
    beforeEach(async () => {
      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Low Priority Task",
          priority: "low",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Medium Priority Task",
          priority: "medium",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Urgent Priority Task",
          priority: "urgent",
        },
      });
    });

    it("should return task priority statistics", async () => {
      const response = await request(app)
        .get("/api/dashboard/task-priority")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const statistics = response.body.data.statistics;

      expect(statistics).toEqual(
        expect.objectContaining({
          low: 1,
          medium: 1,
          high: 1,
          urgent: 1,
        }),
      );

      const total = Object.values(statistics).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(total).toBe(4);
    });

    it("should contain every supported priority", async () => {
      const response = await request(app)
        .get("/api/dashboard/task-priority")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.body.data.statistics).toEqual(
        expect.objectContaining({
          low: expect.any(Number),
          medium: expect.any(Number),
          high: expect.any(Number),
          urgent: expect.any(Number),
        }),
      );
    });

    it("should exclude archived tasks", async () => {
      const archivedTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Urgent Task",
          priority: "urgent",
        },
      });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${archivedTask.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/task-priority")
        .set("Authorization", `Bearer ${owner.token}`);

      const statistics = response.body.data.statistics;

      expect(statistics.urgent).toBe(1);

      const total = Object.values(statistics).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(total).toBe(4);
    });

    it("should exclude tasks from inaccessible workspaces", async () => {
      const stranger = await registerUser({
        name: "Priority Stranger",
      });

      const response = await request(app)
        .get("/api/dashboard/task-priority")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.statistics).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      });
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get("/api/dashboard/task-priority");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/my-tasks", () => {
    let assignedTask1;
    let assignedTask2;

    beforeEach(async () => {
      assignedTask1 = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Frontend Login",
          status: "todo",
          priority: "high",
        },
      });

      assignedTask2 = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Backend API",
          status: "done",
          priority: "urgent",
        },
      });

      await assignTaskToUser({
        token: owner.token,
        taskId: assignedTask1.task.id,
        userId: member.user.id,
      });

      await assignTaskToUser({
        token: owner.token,
        taskId: assignedTask2.task.id,
        userId: member.user.id,
      });
    });

    it("should return only tasks assigned to the logged-in user", async () => {
      const response = await request(app)
        .get("/api/dashboard/my-tasks")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.tasks).toHaveLength(2);
    });

    it("should filter by status", async () => {
      const response = await request(app)
        .get("/api/dashboard/my-tasks?status=done")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].status).toBe("done");
    });

    it("should filter by priority", async () => {
      const response = await request(app)
        .get("/api/dashboard/my-tasks?priority=urgent")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].priority).toBe("urgent");
    });

    it("should search tasks by title", async () => {
      const response = await request(app)
        .get("/api/dashboard/my-tasks?search=frontend")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].title).toContain("Frontend");
    });

    it("should paginate assigned tasks", async () => {
      const response = await request(app)
        .get("/api/dashboard/my-tasks?page=1&limit=1")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);

      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 1,
          total: 2,
          totalPages: 2,
        }),
      );
    });

    it("should return empty array when user has no assigned tasks", async () => {
      const stranger = await registerUser({
        name: "No Tasks User",
      });

      const response = await request(app)
        .get("/api/dashboard/my-tasks")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.tasks).toHaveLength(0);
    });

    it("should reject without authentication", async () => {
      const response = await request(app).get("/api/dashboard/my-tasks");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/recent-activities", () => {
    beforeEach(async () => {
      // Create activities
      await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "First dashboard activity",
        },
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "in-progress",
        });

      await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });
    });

    it("should return recent activities", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-activities")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.activities.length).toBeGreaterThan(0);
    });

    it("should include populated actor, project and task", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-activities")
        .set("Authorization", `Bearer ${owner.token}`);

      const activity = response.body.data.activities[0];

      expect(activity.actor).toBeDefined();
      expect(activity.project).toBeDefined();
      expect(activity.task).toBeDefined();
    });

    it("should return activities in descending order", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-activities")
        .set("Authorization", `Bearer ${owner.token}`);

      const activities = response.body.data.activities;

      expect(
        new Date(activities[0].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(activities[activities.length - 1].createdAt).getTime(),
      );
    });

    it("should return at most 10 recent activities", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-activities")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.activities.length).toBeLessThanOrEqual(10);
    });

    it("should return an empty list for a user with no activity", async () => {
      const stranger = await registerUser({
        name: "No Activity User",
      });

      const response = await request(app)
        .get("/api/dashboard/recent-activities")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.activities).toEqual([]);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app).get(
        "/api/dashboard/recent-activities",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  
  describe("GET /api/dashboard/project-statistics", () => {
    it("should return correct statistics for each project", async () => {
      // The global beforeEach already created:
      // 1 project
      // 1 default todo task

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Completed Project Task",
          status: "done",
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Pending Project Task",
          status: "in-progress",
        },
      });

      const response = await request(app)
        .get("/api/dashboard/project-statistics")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.statistics).toHaveLength(1);

      const statistics = response.body.data.statistics[0];

      expect(statistics).toEqual(
        expect.objectContaining({
          id: project.id,
          totalTasks: 3,
          completedTasks: 1,
          pendingTasks: 2,
          completionPercentage: 33,
        }),
      );
    });

    it("should return zero statistics for a project without tasks", async () => {
      const emptyProjectSetup = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Empty Dashboard Project",
        },
      });

      const response = await request(app)
        .get("/api/dashboard/project-statistics")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const emptyProjectStatistics = response.body.data.statistics.find(
        (item) => item.id === emptyProjectSetup.project.id,
      );

      expect(emptyProjectStatistics).toEqual(
        expect.objectContaining({
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          completionPercentage: 0,
        }),
      );
    });

    it("should exclude archived tasks from project statistics", async () => {
      const archivedTaskSetup = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Project Statistics Task",
          status: "done",
        },
      });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${archivedTaskSetup.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/project-statistics")
        .set("Authorization", `Bearer ${owner.token}`);

      const statistics = response.body.data.statistics.find(
        (item) => item.id === project.id,
      );

      expect(statistics.totalTasks).toBe(1);
      expect(statistics.completedTasks).toBe(0);
      expect(statistics.pendingTasks).toBe(1);
      expect(statistics.completionPercentage).toBe(0);
    });

    it("should exclude archived projects", async () => {
      const archivedProjectSetup = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Archived Statistics Project",
        },
      });

      const archiveResponse = await request(app)
        .patch(`/api/projects/${archivedProjectSetup.project.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/project-statistics")
        .set("Authorization", `Bearer ${owner.token}`);

      const archivedProjectStatistics = response.body.data.statistics.find(
        (item) => item.id === archivedProjectSetup.project.id,
      );

      expect(archivedProjectStatistics).toBeUndefined();
    });

    it("should return an empty list for a user with no accessible projects", async () => {
      const stranger = await registerUser({
        name: "No Project Statistics User",
      });

      const response = await request(app)
        .get("/api/dashboard/project-statistics")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toEqual([]);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get(
        "/api/dashboard/project-statistics",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/recent-notifications", () => {
    beforeEach(async () => {
      await assignTaskToUser({
        token: owner.token,
        taskId: task.id,
        userId: member.user.id,
      });
    });

    it("should return recent notifications", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-notifications")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.notifications.length).toBeGreaterThan(0);
    });

    it("should return notifications only for the logged-in user", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-notifications")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toHaveLength(0);
    });

    it("should return notifications sorted by newest first", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-notifications")
        .set("Authorization", `Bearer ${member.token}`);

      const notifications = response.body.data.notifications;

      if (notifications.length > 1) {
        expect(
          new Date(notifications[0].createdAt).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(notifications[notifications.length - 1].createdAt).getTime(),
        );
      }
    });

    it("should return at most 10 notifications", async () => {
      const response = await request(app)
        .get("/api/dashboard/recent-notifications")
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications.length).toBeLessThanOrEqual(10);
    });

    it("should return an empty list for users without notifications", async () => {
      const stranger = await registerUser({
        name: "No Notification User",
      });

      const response = await request(app)
        .get("/api/dashboard/recent-notifications")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.notifications).toEqual([]);
    });

    it("should reject requests without authentication", async () => {
      const response = await request(app).get(
        "/api/dashboard/recent-notifications",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/productivity", () => {
    it("should return 30 days of productivity data", async () => {
      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.days).toBe(30);
      expect(response.body.data.productivity).toHaveLength(30);

      expect(response.body.data.startDate).toBeDefined();
      expect(response.body.data.endDate).toBeDefined();
    });

    it("should count completed tasks on the correct date", async () => {
      const completedTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Completed Productivity Task",
          status: "todo",
        },
      });

      const statusResponse = await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      expect(statusResponse.statusCode).toBe(200);

      const today = new Date().toISOString().slice(0, 10);

      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${owner.token}`);

      const todayEntry = response.body.data.productivity.find(
        (item) => item.date === today,
      );

      expect(todayEntry).toBeDefined();
      expect(todayEntry.completedTasks).toBe(1);
    });

    it("should return zero for dates without completed tasks", async () => {
      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const completedCounts = response.body.data.productivity.map(
        (item) => item.completedTasks,
      );

      expect(completedCounts.every((count) => count === 0)).toBe(true);
    });

    it("should exclude archived completed tasks", async () => {
      const completedTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Completed Productivity Task",
          status: "todo",
        },
      });

      await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${owner.token}`);

      const today = new Date().toISOString().slice(0, 10);

      const todayEntry = response.body.data.productivity.find(
        (item) => item.date === today,
      );

      expect(todayEntry.completedTasks).toBe(0);
    });

    it("should return zero productivity for a user with no workspaces", async () => {
      const stranger = await registerUser({
        name: "No Productivity User",
      });

      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.productivity).toHaveLength(30);

      expect(
        response.body.data.productivity.every(
          (item) => item.completedTasks === 0,
        ),
      ).toBe(true);
    });

    it("should return continuous dates", async () => {
      const response = await request(app)
        .get("/api/dashboard/productivity")
        .set("Authorization", `Bearer ${owner.token}`);

      const productivity = response.body.data.productivity;

      for (let index = 1; index < productivity.length; index += 1) {
        const previousDate = new Date(
          `${productivity[index - 1].date}T00:00:00.000Z`,
        );

        const currentDate = new Date(
          `${productivity[index].date}T00:00:00.000Z`,
        );

        const differenceInDays =
          (currentDate.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24);

        expect(differenceInDays).toBe(1);
      }
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get("/api/dashboard/productivity");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/dashboard/monthly-analytics", () => {
    it("should return created and completed task counts for the current month", async () => {
      const completedTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Monthly Completed Task",
          status: "todo",
        },
      });

      const statusResponse = await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      expect(statusResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/monthly-analytics")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth() + 1;

      const currentMonthEntry = response.body.data.analytics.find(
        (item) => item.year === currentYear && item.month === currentMonth,
      );

      expect(currentMonthEntry).toBeDefined();

      // One default task from the global beforeEach
      // plus one task created in this test.
      expect(currentMonthEntry.tasksCreated).toBe(2);
      expect(currentMonthEntry.tasksCompleted).toBe(1);
    });

    it("should exclude archived tasks from monthly analytics", async () => {
      const completedTask = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archived Monthly Task",
          status: "todo",
        },
      });

      await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${completedTask.task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .get("/api/dashboard/monthly-analytics")
        .set("Authorization", `Bearer ${owner.token}`);

      const now = new Date();
      const currentMonthEntry = response.body.data.analytics.find(
        (item) =>
          item.year === now.getUTCFullYear() &&
          item.month === now.getUTCMonth() + 1,
      );

      expect(currentMonthEntry.tasksCreated).toBe(1);
      expect(currentMonthEntry.tasksCompleted).toBe(0);
    });

    it("should return analytics sorted chronologically", async () => {
      const response = await request(app)
        .get("/api/dashboard/monthly-analytics")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const analytics = response.body.data.analytics;

      for (let index = 1; index < analytics.length; index += 1) {
        const previous =
          analytics[index - 1].year * 12 + analytics[index - 1].month;

        const current = analytics[index].year * 12 + analytics[index].month;

        expect(current).toBeGreaterThanOrEqual(previous);
      }
    });

    it("should return an empty array for a user with no workspaces", async () => {
      const stranger = await registerUser({
        name: "No Monthly Analytics User",
      });

      const response = await request(app)
        .get("/api/dashboard/monthly-analytics")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toEqual([]);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get(
        "/api/dashboard/monthly-analytics",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
