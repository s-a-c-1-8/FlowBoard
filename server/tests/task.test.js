import request from "supertest";
import app from "../src/app.js";
import Activity from "../src/models/activity.model.js";
import Notification from "../src/models/notification.model.js";
import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";
import { createProject } from "./helpers/project.helper.js";
import { createTask } from "./helpers/task.helper.js";

describe("Task API", () => {
  let owner;
  let workspace;
  let project;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Task Owner",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
      workspace: {
        name: "Task Test Workspace",
      },
    });

    workspace = workspaceSetup.workspace;

    const projectSetup = await createProject({
      token: owner.token,
      workspaceId: workspace.id,
      project: {
        name: "Task Test Project",
      },
    });

    project = projectSetup.project;
  });

  describe("POST /api/tasks/projects/:projectId", () => {
    it("should allow the workspace owner to create a task", async () => {
      const { response, task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(task).toEqual(
        expect.objectContaining({
          title: "Build authentication UI",
          description: "Create login and registration screens",
          status: "todo",
          priority: "high",
          estimatedHours: 8,
          isArchived: false,
        }),
      );

      expect(task.tags).toEqual(["react", "authentication"]);
    });

    it("should allow a workspace admin to create a task", async () => {
      const admin = await registerUser({
        name: "Task Admin",
      });

      const addAdminResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      expect(addAdminResponse.statusCode).toBe(201);

      const { response } = await createTask({
        token: admin.token,
        projectId: project.id,
        task: {
          title: "Admin-created task",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("should reject task creation by a regular member", async () => {
      const member = await registerUser({
        name: "Task Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { response } = await createTask({
        token: member.token,
        projectId: project.id,
      });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject task creation without authentication", async () => {
      const response = await request(app)
        .post(`/api/tasks/projects/${project.id}`)
        .send({
          title: "Unauthorized task",
          description: "Should fail",
          status: "todo",
          priority: "high",
          tags: [],
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject task creation without a title", async () => {
      const response = await request(app)
        .post(`/api/tasks/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          description: "Missing title",
          status: "todo",
          priority: "high",
          tags: [],
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should reject an invalid task status", async () => {
      const { response } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "invalid-status",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task priority", async () => {
      const { response } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          priority: "invalid-priority",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject task creation for a non-member", async () => {
      const stranger = await registerUser({
        name: "Task Stranger",
      });

      const { response } = await createTask({
        token: stranger.token,
        projectId: project.id,
      });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid project ID", async () => {
      const { response } = await createTask({
        token: owner.token,
        projectId: "invalid-id",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown project", async () => {
      const { response } = await createTask({
        token: owner.token,
        projectId: "64b64c5f2f7b5a0012345678",
      });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  describe("GET /api/tasks/projects/:projectId", () => {
    beforeEach(async () => {
      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Authentication UI",
          status: "todo",
          priority: "high",
          tags: ["react"],
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Dashboard",
          status: "in-progress",
          priority: "medium",
          tags: ["node"],
        },
      });

      await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Notification Module",
          status: "done",
          priority: "urgent",
          tags: ["socket"],
        },
      });
    });

    it("should return all project tasks", async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(3);
    });

    it("should filter tasks by status", async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}?status=done`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].status).toBe("done");
    });

    it("should filter tasks by priority", async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}?priority=urgent`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].priority).toBe("urgent");
    });

    it("should search tasks by title", async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}?search=dashboard`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].title).toBe("Dashboard");
    });

    it("should paginate tasks", async () => {
      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}?page=1&limit=2`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.tasks).toHaveLength(2);

      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        }),
      );
    });

    it("should reject access from a non-member", async () => {
      const stranger = await registerUser();

      const response = await request(app)
        .get(`/api/tasks/projects/${project.id}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
    });

    it("should reject invalid project id", async () => {
      const response = await request(app)
        .get("/api/tasks/projects/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get(
        `/api/tasks/projects/${project.id}`,
      );

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/tasks/:taskId", () => {
    it("should return a task for an authorized workspace member", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Task Details Test",
        },
      });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.task).toEqual(
        expect.objectContaining({
          id: task.id,
          title: "Task Details Test",
          status: "todo",
          priority: "high",
          isArchived: false,
        }),
      );

      expect(response.body.data.task.project).toBeDefined();
      expect(response.body.data.task.createdBy).toBeDefined();
    });

    it("should allow a regular workspace member to view a task", async () => {
      const member = await registerUser({
        name: "Task Viewer",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Member Visible Task",
        },
      });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe("Member Visible Task");
    });

    it("should reject task access from a non-member", async () => {
      const stranger = await registerUser({
        name: "Task Stranger",
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .get("/api/tasks/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .get("/api/tasks/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject task access without authentication", async () => {
      const response = await request(app).get(
        "/api/tasks/64b64c5f2f7b5a0012345678",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/tasks/:taskId", () => {
    it("should allow the workspace owner to update a task", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          title: "Updated Task Title",
          priority: "urgent",
          estimatedHours: 12,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.task).toEqual(
        expect.objectContaining({
          id: task.id,
          title: "Updated Task Title",
          priority: "urgent",
          estimatedHours: 12,
        }),
      );
    });

    it("should allow a workspace admin to update a task", async () => {
      const admin = await registerUser({
        name: "Task Admin",
      });

      const addAdminResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      expect(addAdminResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          description: "Updated by admin",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.description).toBe("Updated by admin");
    });

    it("should reject task update by a regular member", async () => {
      const member = await registerUser({
        name: "Task Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${member.token}`)
        .send({
          title: "Member Should Not Update",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an empty update body", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject update when no task changes are detected", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Same Task Title",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          title: "Same Task Title",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("No task changes were detected");
    });

    it("should reject an invalid task status", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "invalid-status",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .patch("/api/tasks/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          title: "Updated Task",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .patch("/api/tasks/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          title: "Updated Task",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject task update without authentication", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app).patch(`/api/tasks/${task.id}`).send({
        title: "Unauthorized Update",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe("PATCH /api/tasks/:taskId/status", () => {
    it("should allow the workspace owner to update task status", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "todo",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "in-progress",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe("in-progress");
      expect(response.body.data.task.completedAt).toBeNull();
    });

    it("should set completedAt when task status becomes done", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "in-progress",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.task.status).toBe("done");
      expect(response.body.data.task.completedAt).not.toBeNull();

      const completedAt = new Date(response.body.data.task.completedAt);

      expect(Number.isNaN(completedAt.getTime())).toBe(false);
    });

    it("should clear completedAt when task moves away from done", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "done",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "in-progress",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.task.status).toBe("in-progress");
      expect(response.body.data.task.completedAt).toBeNull();
    });

    it("should create a status-change activity", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "todo",
        },
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "in-progress",
        });

      const activity = await Activity.findOne({
        task: task.id,
        type: "task-status-changed",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.metadata.oldStatus).toBe("todo");
      expect(activity.metadata.newStatus).toBe("in-progress");
    });

    it("should reject updating to the same status", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          status: "todo",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "todo",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Task already has this status");
    });

    it("should allow a workspace admin to update task status", async () => {
      const admin = await registerUser({
        name: "Status Admin",
      });

      const addAdminResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      expect(addAdminResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          status: "in-progress",
        });

      expect(response.statusCode).toBe(200);
    });

    it("should reject status update by a regular member", async () => {
      const member = await registerUser({
        name: "Status Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${member.token}`)
        .send({
          status: "in-progress",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid status", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "invalid-status",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject status update for an archived task", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .patch("/api/tasks/invalid-id/status")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "done",
        });

      expect(response.statusCode).toBe(400);
    });

    it("should reject status update without authentication", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/status`)
        .send({
          status: "done",
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/tasks/:taskId/assignee", () => {
    const addWorkspaceMember = async ({ user, role = "member" }) => {
      const response = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: user.user.email,
          role,
        });

      expect(response.statusCode).toBe(201);

      return response;
    };

    it("should allow the workspace owner to assign a task to a member", async () => {
      const member = await registerUser({
        name: "Assigned Member",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Assign Member Task",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.task.assignedTo).toEqual(
        expect.objectContaining({
          id: member.user.id,
          name: "Assigned Member",
          email: member.user.email,
        }),
      );
    });

    it("should allow a workspace admin to assign a task", async () => {
      const admin = await registerUser({
        name: "Assignment Admin",
      });

      const member = await registerUser({
        name: "Admin Assigned Member",
      });

      await addWorkspaceMember({
        user: admin,
        role: "admin",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.assignedTo.id).toBe(member.user.id);
    });

    it("should allow reassignment from one member to another", async () => {
      const firstMember = await registerUser({
        name: "First Assignee",
      });

      const secondMember = await registerUser({
        name: "Second Assignee",
      });

      await addWorkspaceMember({
        user: firstMember,
      });

      await addWorkspaceMember({
        user: secondMember,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const firstAssignment = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: firstMember.user.id,
        });

      expect(firstAssignment.statusCode).toBe(200);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: secondMember.user.id,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.task.assignedTo.id).toBe(secondMember.user.id);

      const activity = await Activity.findOne({
        task: task.id,
        type: "task-assignee-changed",
        "metadata.oldAssignee": firstMember.user.id,
        "metadata.newAssignee": secondMember.user.id,
      });

      expect(activity).not.toBeNull();
    });

    it("should allow the task to be unassigned", async () => {
      const member = await registerUser({
        name: "Unassigned Member",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const assignResponse = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(assignResponse.statusCode).toBe(200);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: null,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.assignedTo).toBeNull();

      const activity = await Activity.findOne({
        task: task.id,
        type: "task-assignee-changed",
        "metadata.oldAssignee": member.user.id,
        "metadata.newAssignee": null,
      });

      expect(activity).not.toBeNull();
    });

    it("should reject assigning the same user again", async () => {
      const member = await registerUser({
        name: "Duplicate Assignee",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Task is already assigned to this user",
      );
    });

    it("should reject unassigning an already unassigned task", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: null,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Task is already unassigned");
    });

    it("should reject assigning a user outside the workspace", async () => {
      const stranger = await registerUser({
        name: "Outside User",
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: stranger.user.id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Task can only be assigned to a workspace member",
      );
    });

    it("should reject assignee update by a regular member", async () => {
      const member = await registerUser({
        name: "Regular Assignment Member",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${member.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject reassignment of an archived task", async () => {
      const member = await registerUser({
        name: "Archived Task Member",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const archiveResponse = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(archiveResponse.statusCode).toBe(200);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Archived tasks cannot be reassigned");
    });

    it("should create an assignee-change activity", async () => {
      const member = await registerUser({
        name: "Activity Assignee",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(200);

      const activity = await Activity.findOne({
        task: task.id,
        type: "task-assignee-changed",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.workspace.toString()).toBe(workspace.id);
      expect(activity.project.toString()).toBe(project.id);
      expect(activity.metadata.oldAssignee).toBeNull();
      expect(activity.metadata.newAssignee.toString()).toBe(member.user.id);
    });

    it("should create exactly one notification for the new assignee", async () => {
      const member = await registerUser({
        name: "Notification Assignee",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Notification Test Task",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      expect(response.statusCode).toBe(200);

      const notifications = await Notification.find({
        recipient: member.user.id,
        task: task.id,
        type: "task-assigned",
      });

      expect(notifications).toHaveLength(1);

      expect(notifications[0].sender.toString()).toBe(owner.user.id);

      expect(notifications[0].isRead).toBe(false);
      expect(notifications[0].title).toBe("Task assigned to you");

      expect(notifications[0].message).toContain("Notification Test Task");
    });

    it("should not create a notification when assigning the task to yourself", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: owner.user.id,
        });

      expect(response.statusCode).toBe(200);

      const notificationCount = await Notification.countDocuments({
        recipient: owner.user.id,
        task: task.id,
        type: "task-assigned",
      });

      expect(notificationCount).toBe(0);
    });

    it("should notify only the new assignee during reassignment", async () => {
      const firstMember = await registerUser({
        name: "Previous Assignee",
      });

      const secondMember = await registerUser({
        name: "New Assignee",
      });

      await addWorkspaceMember({
        user: firstMember,
      });

      await addWorkspaceMember({
        user: secondMember,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: firstMember.user.id,
        });

      // Remove notifications created by the first assignment
      // so this assertion focuses only on reassignment.
      await Notification.deleteMany({
        task: task.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: secondMember.user.id,
        });

      expect(response.statusCode).toBe(200);

      const previousAssigneeNotifications = await Notification.countDocuments({
        recipient: firstMember.user.id,
        task: task.id,
      });

      const newAssigneeNotifications = await Notification.countDocuments({
        recipient: secondMember.user.id,
        task: task.id,
        type: "task-assigned",
      });

      expect(previousAssigneeNotifications).toBe(0);
      expect(newAssigneeNotifications).toBe(1);
    });

    it("should not create a notification when a task is unassigned", async () => {
      const member = await registerUser({
        name: "Member To Unassign",
      });

      await addWorkspaceMember({
        user: member,
      });

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: member.user.id,
        });

      await Notification.deleteMany({
        task: task.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: null,
        });

      expect(response.statusCode).toBe(200);

      const notificationCount = await Notification.countDocuments({
        task: task.id,
      });

      expect(notificationCount).toBe(0);
    });

    it("should reject an invalid assignee ID", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: "invalid-user-id",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .patch("/api/tasks/invalid-id/assignee")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: owner.user.id,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .patch("/api/tasks/64b64c5f2f7b5a0012345678/assignee")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          assignedTo: owner.user.id,
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject assignee update without authentication", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/assignee`)
        .send({
          assignedTo: owner.user.id,
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/tasks/:taskId/archive", () => {
    it("should allow the workspace owner to archive a task", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.task).toEqual(
        expect.objectContaining({
          id: task.id,
          isArchived: true,
        }),
      );
    });

    it("should allow a workspace admin to archive a task", async () => {
      const admin = await registerUser({
        name: "Archive Admin",
      });

      const addAdminResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      expect(addAdminResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.task.isArchived).toBe(true);
    });

    it("should reject archive by a regular member", async () => {
      const member = await registerUser({
        name: "Archive Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should create a task-archived activity", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
        task: {
          title: "Archive Activity Task",
        },
      });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const activity = await Activity.findOne({
        task: task.id,
        type: "task-archived",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.metadata.title).toBe("Archive Activity Task");
    });

    it("should reject archiving an already archived task", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Task is already archived");
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .patch("/api/tasks/invalid-id/archive")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .patch("/api/tasks/64b64c5f2f7b5a0012345678/archive")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject archive without authentication", async () => {
      const { task } = await createTask({
        token: owner.token,
        projectId: project.id,
      });

      const response = await request(app).patch(
        `/api/tasks/${task.id}/archive`,
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
});
