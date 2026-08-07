import express from "express";

import {
  archiveProject,
  createProject,
  getProjectById,
  getWorkspaceProjects,
  updateProject,
} from "../controllers/project.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  requireWorkspaceRoles,
  verifyWorkspaceMember,
} from "../middlewares/workspace.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createProjectSchema,
  getWorkspaceProjectsSchema,
  projectIdSchema,
  updateProjectSchema,
} from "../validations/project.validation.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";

const router = express.Router();

router
  .route("/workspaces/:workspaceId")
  .post(
    protect,
    validate(createProjectSchema),
    verifyWorkspaceMember,
    requireWorkspaceRoles("owner", "admin"),
    createProject,
  )
  .get(
    protect,
    validate(getWorkspaceProjectsSchema),
    verifyWorkspaceMember,
    getWorkspaceProjects,
  );

router
  .route("/:projectId")
  .get(protect, validate(projectIdSchema), verifyProjectAccess, getProjectById)
  .patch(
    protect,
    validate(updateProjectSchema),
    verifyProjectAccess,
    requireWorkspaceRoles("owner", "admin"),
    updateProject,
  );

  router.patch(
    "/:projectId/archive",
    protect,
    validate(projectIdSchema),
    verifyProjectAccess,
    requireWorkspaceRoles("owner", "admin"),
    archiveProject,
  );
export default router;
