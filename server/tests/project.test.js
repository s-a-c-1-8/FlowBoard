import request from "supertest";
import app from "../src/app.js";

import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";
import { createProject } from "./helpers/project.helper.js";

describe("Project API", () => {
  let owner;
  let workspace;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Project Owner",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
      workspace: {
        name: "Project Test Workspace",
      },
    });

    workspace = workspaceSetup.workspace;
  });

  describe("POST /api/projects/workspaces/:workspaceId", () => {
    it("should allow the workspace owner to create a project", async () => {
      const { response, project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(project).toEqual(
        expect.objectContaining({
          name: "Project Management SaaS",
          description: "Main project for testing",
          status: "active",
          priority: "high",
        }),
      );
    });

    it("should reject project creation without authentication", async () => {
      const response = await request(app)
        .post(`/api/projects/workspaces/${workspace.id}`)
        .send({
          name: "Unauthorized Project",
          description: "Should fail",
          status: "active",
          priority: "high",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject project creation without a name", async () => {
      const response = await request(app)
        .post(`/api/projects/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          description: "Missing project name",
          status: "active",
          priority: "high",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should reject project creation for a non-member", async () => {
      const stranger = await registerUser({
        name: "Project Stranger",
      });

      const response = await request(app)
        .post(`/api/projects/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${stranger.token}`)
        .send({
          name: "Unauthorized Project",
          description: "Should fail",
          status: "active",
          priority: "high",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid workspace ID", async () => {
      const response = await request(app)
        .post("/api/projects/workspaces/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Invalid Workspace Project",
          description: "Should fail",
          status: "active",
          priority: "high",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown workspace", async () => {
      const response = await request(app)
        .post("/api/projects/workspaces/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Unknown Workspace Project",
          description: "Should fail",
          status: "active",
          priority: "high",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  describe("GET /api/projects/workspaces/:workspaceId", () => {
    it("should return projects for the workspace owner", async () => {
      await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Project One",
        },
      });

      await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Project Two",
        },
      });

      const response = await request(app)
        .get(`/api/projects/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.projects).toHaveLength(2);

      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Project One",
          }),
          expect.objectContaining({
            name: "Project Two",
          }),
        ]),
      );
    });

    it("should allow a workspace member to view projects", async () => {
      const member = await registerUser({
        name: "Workspace Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Member Visible Project",
        },
      });

      const response = await request(app)
        .get(`/api/projects/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Member Visible Project",
          }),
        ]),
      );
    });

    it("should reject project listing for a non-member", async () => {
      const stranger = await registerUser({
        name: "Project Stranger",
      });

      const response = await request(app)
        .get(`/api/projects/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject project listing without authentication", async () => {
      const response = await request(app).get(
        `/api/projects/workspaces/${workspace.id}`,
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid workspace ID", async () => {
      const response = await request(app)
        .get("/api/projects/workspaces/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown workspace", async () => {
      const response = await request(app)
        .get("/api/projects/workspaces/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  describe("GET /api/projects/:projectId", () => {
    it("should return a project for an authorized workspace member", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Project Details Test",
        },
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.project).toEqual(
        expect.objectContaining({
          id: project.id,
          name: "Project Details Test",
          status: "active",
          priority: "high",
        }),
      );
    });

    it("should allow a workspace member to view a project", async () => {
      const member = await registerUser({
        name: "Project Viewer",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
        project: {
          name: "Member View Project",
        },
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe("Member View Project");
    });

    it("should reject access from a non-member", async () => {
      const stranger = await registerUser({
        name: "Project Stranger",
      });

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid project ID", async () => {
      const response = await request(app)
        .get("/api/projects/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown project", async () => {
      const response = await request(app)
        .get("/api/projects/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject the request without authentication", async () => {
      const response = await request(app).get(
        "/api/projects/64b64c5f2f7b5a0012345678",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/projects/:projectId", () => {
    it("should allow the workspace owner to update a project", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Updated Project Name",
          priority: "urgent",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.project).toEqual(
        expect.objectContaining({
          id: project.id,
          name: "Updated Project Name",
          priority: "urgent",
        }),
      );
    });

    it("should allow a workspace admin to update a project", async () => {
      const admin = await registerUser({
        name: "Workspace Admin",
      });

      const addAdminResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      expect(addAdminResponse.statusCode).toBe(201);

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          description: "Updated by workspace admin",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.project.description).toBe(
        "Updated by workspace admin",
      );
    });

    it("should reject project update by a regular member", async () => {
      const member = await registerUser({
        name: "Regular Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${member.token}`)
        .send({
          name: "Member Should Not Update",
        });

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an empty update body", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid project status", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          status: "invalid-status",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid project ID", async () => {
      const response = await request(app)
        .patch("/api/projects/invalid-id")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Updated Name",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown project", async () => {
      const response = await request(app)
        .patch("/api/projects/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Updated Name",
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject project update without authentication", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .send({
          name: "Unauthorized Update",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  describe("PATCH /api/projects/:projectId/archive", () => {
    it("should allow the workspace owner to archive a project", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.project).toEqual(
        expect.objectContaining({
          id: project.id,
          isArchived: true,
        }),
      );
    });

    it("should allow a workspace admin to archive a project", async () => {
      const admin = await registerUser({
        name: "Workspace Admin",
      });

      await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: admin.user.email,
          role: "admin",
        });

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}/archive`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject archive by a regular member", async () => {
      const member = await registerUser({
        name: "Workspace Member",
      });

      await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: member.user.email,
          role: "member",
        });

      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app)
        .patch(`/api/projects/${project.id}/archive`)
        .set("Authorization", `Bearer ${member.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject archiving an already archived project", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      await request(app)
        .patch(`/api/projects/${project.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      const response = await request(app)
        .patch(`/api/projects/${project.id}/archive`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid project ID", async () => {
      const response = await request(app)
        .patch("/api/projects/invalid-id/archive")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown project", async () => {
      const response = await request(app)
        .patch("/api/projects/64b64c5f2f7b5a0012345678/archive")
        .set("Authorization", `Bearer ${owner.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject archive without authentication", async () => {
      const { project } = await createProject({
        token: owner.token,
        workspaceId: workspace.id,
      });

      const response = await request(app).patch(
        `/api/projects/${project.id}/archive`,
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
