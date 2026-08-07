import express from "express";
import {
  addWorkspaceMember,
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  leaveWorkspace,
} from "../controllers/workspace.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  requireWorkspaceRoles,
  verifyWorkspaceMember,
} from "../middlewares/workspace.middleware.js";
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceMemberRoleSchema,
  workspaceIdSchema,
  updateWorkspaceSchema,
  removeWorkspaceMemberSchema,
  leaveWorkspaceSchema,
} from "../validations/workspace.validation.js";

const router = express.Router();

router
  .route("/")
  .post(protect, validate(createWorkspaceSchema), createWorkspace)
  .get(protect, getUserWorkspaces);

router
  .route("/:workspaceId")
  .get(
    protect,
    validate(workspaceIdSchema),
    verifyWorkspaceMember,
    getWorkspaceById,
  )
  .patch(
    protect,
    validate(updateWorkspaceSchema),
    verifyWorkspaceMember,
    requireWorkspaceRoles("owner", "admin"),
    updateWorkspace,
  );

  router.post(
    "/:workspaceId/members",
    protect,
    validate(addWorkspaceMemberSchema),
    verifyWorkspaceMember,
    requireWorkspaceRoles("owner", "admin"),
    addWorkspaceMember,
  );

  router
    .route("/:workspaceId/members/:memberId")
    .patch(
      protect,
      validate(updateWorkspaceMemberRoleSchema),
      verifyWorkspaceMember,
      requireWorkspaceRoles("owner", "admin"),
      updateWorkspaceMemberRole,
    )
    .delete(
      protect,
      validate(removeWorkspaceMemberSchema),
      verifyWorkspaceMember,
      requireWorkspaceRoles("owner", "admin"),
      removeWorkspaceMember,
    );

    router.post(
      "/:workspaceId/leave",

      protect,

      validate(leaveWorkspaceSchema),

      verifyWorkspaceMember,

      leaveWorkspace,
    );
export default router;
