import request from "supertest";
import app from "../src/app.js";
import Workspace from "../src/models/workspace.model.js";
import { createWorkspace} from "./helpers/workspace.helper.js";
import { registerUser } from "./helpers/auth.helper.js";

describe("Workspace API", () => {
  let token;
  let user;

  beforeEach(async () => {
    const auth = await registerUser();

    token = auth.token;
    user = auth.user;
  });

  describe("POST /api/workspaces", () => {
    it("should create a workspace successfully", async () => {
      const response = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Engineering Team",
          description: "Workspace for engineering projects",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.workspace).toEqual(
        expect.objectContaining({
          name: "Engineering Team",
          description: "Workspace for engineering projects",
        }),
      );

      const workspaceInDatabase = await Workspace.findOne({
        name: "Engineering Team",
      });

      expect(workspaceInDatabase).not.toBeNull();
      expect(workspaceInDatabase.owner.toString()).toBe(user.id);

      expect(workspaceInDatabase.members).toHaveLength(1);
      expect(workspaceInDatabase.members[0].user.toString()).toBe(user.id);

      expect(workspaceInDatabase.members[0].role).toBe("owner");
    });

    it("should reject workspace creation without authentication", async () => {
      const response = await request(app).post("/api/workspaces").send({
        name: "Engineering Team",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject workspace creation without a name", async () => {
      const response = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({
          description: "Missing name",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/workspaces", () => {
    it("should return workspaces accessible to the user", async () => {
      await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Workspace One",
          description: "First workspace",
        });

      await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Workspace Two",
          description: "Second workspace",
        });

      const response = await request(app)
        .get("/api/workspaces")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.workspaces).toHaveLength(2);

      expect(response.body.data.workspaces).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Workspace One",
          }),
          expect.objectContaining({
            name: "Workspace Two",
          }),
        ]),
      );
    });

    it("should reject workspace listing without authentication", async () => {
      const response = await request(app).get("/api/workspaces");

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  describe("GET /api/workspaces/:workspaceId", () => {
    describe("GET /api/workspaces/:workspaceId", () => {
      it("should return a workspace for the owner", async () => {
        const { workspace } = await createWorkspace({
          token,
        });

        const response = await request(app)
          .get(`/api/workspaces/${workspace.id}`)
          .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data.workspace).toEqual(
          expect.objectContaining({
            id: workspace.id,
            name: workspace.name,
          }),
        );
      });
    });

    it("should reject access from a non-member", async () => {
      const createResponse = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Private Workspace",
        });

      const workspaceId = createResponse.body.data.workspace.id;

      const strangerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Stranger User",
          email: `stranger${Date.now()}@example.com`,
          password: "Password123",
        });

      const strangerToken = strangerResponse.body.data.token;

      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid workspace ID", async () => {
      const response = await request(app)
        .get("/api/workspaces/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for a workspace that does not exist", async () => {
      const response = await request(app)
        .get("/api/workspaces/64b64c5f2f7b5a0012345678")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should reject the request without authentication", async () => {
      const response = await request(app).get(
        "/api/workspaces/64b64c5f2f7b5a0012345678",
      );

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
