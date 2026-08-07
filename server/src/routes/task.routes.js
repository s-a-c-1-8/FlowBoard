import express from "express";

import {
  archiveTask,
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskAssignee,
  updateTaskStatus,
} from "../controllers/task.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { verifyProjectAccess } from "../middlewares/project.middleware.js";
import { verifyTaskAccess } from "../middlewares/task.middleware.js";
import { requireWorkspaceRoles } from "../middlewares/workspace.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createTaskSchema,
  getProjectTasksSchema,
  taskIdSchema,
  updateTaskAssigneeSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../validations/task.validation.js";

const router = express.Router();

router
  .route("/projects/:projectId")
  .post(
    protect,
    validate(createTaskSchema),
    verifyProjectAccess,
    requireWorkspaceRoles("owner", "admin"),
    createTask,
  )
  .get(
    protect,
    validate(getProjectTasksSchema),
    verifyProjectAccess,
    getProjectTasks,
  );

router
  .route("/:taskId")
  .get(protect, validate(taskIdSchema), verifyTaskAccess, getTaskById)
  .patch(
    protect,
    validate(updateTaskSchema),
    verifyTaskAccess,
    requireWorkspaceRoles("owner", "admin"),
    updateTask,
  );

  router.patch(
    "/:taskId/status",
    protect,
    validate(updateTaskStatusSchema),
    verifyTaskAccess,
    requireWorkspaceRoles("owner", "admin"),
    updateTaskStatus,
  );

  router.patch(
    "/:taskId/assignee",
    protect,
    validate(updateTaskAssigneeSchema),
    verifyTaskAccess,
    requireWorkspaceRoles("owner", "admin"),
    updateTaskAssignee,
  );

  router.patch(
    "/:taskId/archive",
    protect,
    validate(taskIdSchema),
    verifyTaskAccess,
    requireWorkspaceRoles("owner", "admin"),
    archiveTask,
  );

export default router;
