import request from "supertest";
import app from "../src/app.js";

import Activity from "../src/models/activity.model.js";

import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";
import { createProject } from "./helpers/project.helper.js";
import { createTask } from "./helpers/task.helper.js";
import { createComment } from "./helpers/comment.helper.js";

describe("Comment API", () => {
  let owner;
  let workspace;
  let project;
  let task;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Comment Owner",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
    });

    workspace = workspaceSetup.workspace;

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

  describe("POST /api/comments/tasks/:taskId", () => {
    it("should allow an authorized workspace member to create a comment", async () => {
      const { response, comment } = await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Authentication UI is ready for review.",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(comment).toEqual(
        expect.objectContaining({
          content: "Authentication UI is ready for review.",
          isEdited: false,
          isDeleted: false,
        }),
      );

      expect(comment.author).toEqual(
        expect.objectContaining({
          id: owner.user.id,
          email: owner.user.email,
        }),
      );
    });

    it("should create a comment-added activity", async () => {
      const { response, comment } = await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Activity timeline test comment.",
        },
      });

      expect(response.statusCode).toBe(201);

      const activity = await Activity.findOne({
        task: task.id,
        type: "comment-added",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.workspace.toString()).toBe(workspace.id);
      expect(activity.project.toString()).toBe(project.id);
      expect(activity.metadata.commentId.toString()).toBe(comment.id);
    });

    it("should allow a regular workspace member to create a comment", async () => {
      const member = await registerUser({
        name: "Comment Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { response, comment } = await createComment({
        token: member.token,
        taskId: task.id,
        comment: {
          content: "Comment from a workspace member.",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(comment.author.id).toBe(member.user.id);
    });

    it("should reject comment creation by a non-member", async () => {
      const stranger = await registerUser({
        name: "Comment Stranger",
      });

      const { response } = await createComment({
        token: stranger.token,
        taskId: task.id,
      });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject comment creation without authentication", async () => {
      const response = await request(app)
        .post(`/api/comments/tasks/${task.id}`)
        .send({
          content: "Unauthorized comment.",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject comment creation with empty content", async () => {
      const response = await request(app)
        .post(`/api/comments/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .post("/api/comments/tasks/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Invalid task comment.",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .post("/api/comments/tasks/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Unknown task comment.",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/comments/tasks/:taskId", () => {
    beforeEach(async () => {
      await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "First comment",
        },
      });

      await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Second comment",
        },
      });

      await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Third comment",
        },
      });
    });

    it("should return all comments for a task", async () => {
      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(3);
    });

    it("should return comments with author details", async () => {
      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      expect(response.body.data.comments[0].author).toEqual(
        expect.objectContaining({
          id: owner.user.id,
          name: "Comment Owner",
          email: owner.user.email,
        }),
      );
    });

    it("should paginate task comments", async () => {
      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}?page=1&limit=2`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.comments).toHaveLength(2);

      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        }),
      );
    });

    it("should sort comments in ascending order", async () => {
      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}?sortOrder=asc`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const comments = response.body.data.comments;

      expect(comments[0].content).toBe("First comment");
      expect(comments[2].content).toBe("Third comment");
    });

    it("should sort comments in descending order", async () => {
      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}?sortOrder=desc`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);

      const comments = response.body.data.comments;

      expect(comments[0].content).toBe("Third comment");
      expect(comments[2].content).toBe("First comment");
    });

    it("should allow a workspace member to view comments", async () => {
      const member = await registerUser({
        name: "Comment Viewer",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.comments).toHaveLength(3);
    });

    it("should reject comment listing for a non-member", async () => {
      const stranger = await registerUser({
        name: "Comment Stranger",
      });

      const response = await request(app)
        .get(`/api/comments/tasks/${task.id}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid task ID", async () => {
      const response = await request(app)
        .get("/api/comments/tasks/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown task", async () => {
      const response = await request(app)
        .get("/api/comments/tasks/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject comment listing without authentication", async () => {
      const response = await request(app).get(`/api/comments/tasks/${task.id}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/comments/:commentId", () => {
    it("should allow the comment author to update a comment", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Original Comment",
        },
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Updated Comment",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.comment).toEqual(
        expect.objectContaining({
          id: comment.id,
          content: "Updated Comment",
          isEdited: true,
        }),
      );
    });

    it("should create a comment-updated activity", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Edited Comment",
        });

      const activity = await Activity.findOne({
        task: task.id,
        type: "comment-updated",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.metadata.commentId.toString()).toBe(comment.id);
    });

    it("should reject comment update by another member", async () => {
      const member = await registerUser({
        name: "Another Member",
      });

      await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${member.token}`)
        .send({
          content: "Unauthorized Edit",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject empty content", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid comment ID", async () => {
      const response = await request(app)
        .patch("/api/comments/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Updated",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown comment", async () => {
      const response = await request(app)
        .patch("/api/comments/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          content: "Updated",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject update without authentication", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      const response = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .send({
          content: "Updated",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });


  describe("DELETE /api/comments/:commentId", () => {
    it("should allow the comment author to delete a comment", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Delete me",
        },
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should create a comment-deleted activity", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
        comment: {
          content: "Activity delete test",
        },
      });

      await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      const activity = await Activity.findOne({
        task: task.id,
        type: "comment-deleted",
      });

      expect(activity).not.toBeNull();
      expect(activity.actor.toString()).toBe(owner.user.id);
      expect(activity.metadata.commentId.toString()).toBe(comment.id);
    });

    it("should reject deletion by another workspace member", async () => {
      const member = await registerUser({
        name: "Delete Member",
      });

      await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      const response = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid comment ID", async () => {
      const response = await request(app)
        .delete("/api/comments/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown comment", async () => {
      const response = await request(app)
        .delete("/api/comments/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject deletion without authentication", async () => {
      const { comment } = await createComment({
        token: owner.token,
        taskId: task.id,
      });

      const response = await request(app).delete(`/api/comments/${comment.id}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});