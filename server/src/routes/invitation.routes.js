import express from "express";

import {
  acceptInvitation,
  cancelInvitation,
  createWorkspaceInvitation,
  getMyInvitations,
  getWorkspaceInvitations,
  rejectInvitation,
} from "../controllers/invitation.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

import {
  requireWorkspaceRoles,
  verifyWorkspaceMember,
} from "../middlewares/workspace.middleware.js";

import validate from "../middlewares/validate.middleware.js";

import {
  cancelInvitationSchema,
  createInvitationSchema,
  getMyInvitationsSchema,
  getWorkspaceInvitationsSchema,
  invitationIdSchema,
} from "../validations/invitation.validation.js";

const router = express.Router();

router.get("/", protect, validate(getMyInvitationsSchema), getMyInvitations);

router.post(
  "/:invitationId/accept",
  protect,
  validate(invitationIdSchema),
  acceptInvitation,
);


router.post(
  "/:invitationId/reject",
  protect,
  validate(invitationIdSchema),
  rejectInvitation,
);

router.post(
  "/workspaces/:workspaceId",
  protect,
  validate(createInvitationSchema),
  verifyWorkspaceMember,
  requireWorkspaceRoles("owner", "admin"),
  createWorkspaceInvitation,
);


router.get(
  "/workspaces/:workspaceId",
  protect,
  validate(getWorkspaceInvitationsSchema),
  verifyWorkspaceMember,
  requireWorkspaceRoles("owner", "admin"),
  getWorkspaceInvitations,
);

router.delete(
  "/workspaces/:workspaceId/:invitationId",
  protect,
  validate(cancelInvitationSchema),
  verifyWorkspaceMember,
  requireWorkspaceRoles("owner", "admin"),
  cancelInvitation,
);

export default router;
