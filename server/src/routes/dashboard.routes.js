import express from "express";

import {
  getDashboardSummary,
  getMyTasks,
  getRecentActivities,
  getTaskPriorityStatistics,
  getTaskStatusStatistics,
  getProjectStatistics,
  getRecentNotifications,
  getProductivityStatistics,
  getMonthlyAnalytics,
} from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { getMyTasksSchema } from "../validations/dashboard.validation.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);
router.get("/task-status", protect, getTaskStatusStatistics);
router.get("/task-priority", protect, getTaskPriorityStatistics);
router.get("/my-tasks", protect, validate(getMyTasksSchema), getMyTasks,);
router.get("/recent-activities", protect, getRecentActivities);
router.get("/project-statistics", protect, getProjectStatistics);
router.get("/recent-notifications", protect, getRecentNotifications);
router.get("/productivity", protect, getProductivityStatistics);
router.get("/monthly-analytics", protect, getMonthlyAnalytics);

export default router;
