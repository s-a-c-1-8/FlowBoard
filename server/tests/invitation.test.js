import request from "supertest";
import app from "../src/app.js";

import { registerUser } from "./helpers/auth.helper.js";
import { createWorkspace } from "./helpers/workspace.helper.js";

describe("Invitation API", () => {
  let owner;
  let workspace;

  beforeEach(async () => {
    owner = await registerUser({
      name: "Workspace Owner",
    });

    const workspaceSetup = await createWorkspace({
      token: owner.token,
      workspace: {
        name: "Invitation Test Workspace",
      },
    });

    workspace = workspaceSetup.workspace;
  });

  describe("POST /api/invitations/workspaces/:workspaceId", () => {
    it("should allow the workspace owner to create an invitation", async () => {
      const response = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "invitee@example.com",
          role: "member",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.invitation).toEqual(
        expect.objectContaining({
          email: "invitee@example.com",
          role: "member",
          status: "pending",
        }),
      );

      expect(response.body.data.invitation.workspace).toEqual(
        expect.objectContaining({
          id: workspace.id,
          name: "Invitation Test Workspace",
        }),
      );

      expect(response.body.data.invitation.invitedBy).toEqual(
        expect.objectContaining({
          id: owner.user.id,
          email: owner.user.email,
        }),
      );
    });

    it("should reject invitation creation without authentication", async () => {
      const response = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .send({
          email: "invitee@example.com",
          role: "member",
        });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invitation with invalid email", async () => {
      const response = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "invalid-email",
          role: "member",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it("should reject a duplicate pending invitation", async () => {
      const payload = {
        email: "duplicate@example.com",
        role: "member",
      };

      await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload);

      const response = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send(payload);

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "A pending invitation already exists for this email",
      );
    });

    it("should reject inviting an existing workspace member", async () => {
      const existingMember = await registerUser({
        name: "Existing Member",
      });

      const addMemberResponse = await request(app)
        .post(`/api/workspaces/${workspace.id}/members`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: existingMember.user.email,
          role: "member",
        });

      expect(addMemberResponse.statusCode).toBe(201);

      const response = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: existingMember.user.email,
          role: "member",
        });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "This user is already a workspace member",
      );
    });
  });

  describe("POST /api/invitations/:invitationId/accept", () => {
    it("should allow the invited user to accept an invitation", async () => {
      const invitedUser = await registerUser({
        name: "Invited User",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      expect(invitationResponse.statusCode).toBe(201);

      const invitation = invitationResponse.body.data.invitation;

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/accept`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invitation accepted successfully");

      expect(response.body.data.invitation).toEqual(
        expect.objectContaining({
          id: invitation.id,
          status: "accepted",
        }),
      );

      const workspaceResponse = await request(app)
        .get(`/api/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(workspaceResponse.statusCode).toBe(200);

      const members = workspaceResponse.body.data.workspace.members;

      expect(members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: "member",
          }),
        ]),
      );
    });

    it("should reject acceptance by a different user", async () => {
      const invitedUser = await registerUser({
        name: "Correct Invitee",
      });

      const stranger = await registerUser({
        name: "Wrong User",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      const invitation = invitationResponse.body.data.invitation;

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/accept`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invitation that was already accepted", async () => {
      const invitedUser = await registerUser({
        name: "Accepted User",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      const invitation = invitationResponse.body.data.invitation;

      await request(app)
        .post(`/api/invitations/${invitation.id}/accept`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/accept`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid invitation ID", async () => {
      const invitedUser = await registerUser();

      const response = await request(app)
        .post("/api/invitations/invalid-id/accept")
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown invitation", async () => {
      const invitedUser = await registerUser();

      const response = await request(app)
        .post("/api/invitations/64b64c5f2f7b5a0012345678/accept")
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/invitations/:invitationId/reject", () => {
    it("should allow the invited user to reject an invitation", async () => {
      const invitedUser = await registerUser({
        name: "Rejecting User",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      expect(invitationResponse.statusCode).toBe(201);

      const invitation = invitationResponse.body.data.invitation;

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/reject`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Invitation rejected successfully");

      expect(response.body.data.invitation).toEqual(
        expect.objectContaining({
          id: invitation.id,
          status: "rejected",
        }),
      );

      // Rejected user must not gain workspace access.
      const workspaceResponse = await request(app)
        .get(`/api/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(workspaceResponse.statusCode).toBe(403);
    });

    it("should reject rejection by a different user", async () => {
      const invitedUser = await registerUser({
        name: "Correct Invitee",
      });

      const stranger = await registerUser({
        name: "Stranger",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      const invitation = invitationResponse.body.data.invitation;

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/reject`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invitation that was already rejected", async () => {
      const invitedUser = await registerUser({
        name: "Already Rejected User",
      });

      const invitationResponse = await request(app)
        .post(`/api/invitations/workspaces/${workspace.id}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: invitedUser.user.email,
          role: "member",
        });

      const invitation = invitationResponse.body.data.invitation;

      await request(app)
        .post(`/api/invitations/${invitation.id}/reject`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      const response = await request(app)
        .post(`/api/invitations/${invitation.id}/reject`)
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject an invalid invitation ID", async () => {
      const invitedUser = await registerUser();

      const response = await request(app)
        .post("/api/invitations/invalid-id/reject")
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 for an unknown invitation", async () => {
      const invitedUser = await registerUser();

      const response = await request(app)
        .post("/api/invitations/64b64c5f2f7b5a0012345678/reject")
        .set("Authorization", `Bearer ${invitedUser.token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
