import express from "express";

import { getTaskActivities } from "../controllers/activity.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { verifyTaskAccess } from "../middlewares/task.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { getTaskActivitiesSchema } from "../validations/activity.validation.js";

const router = express.Router();

router.get(
  "/tasks/:taskId",
  protect,
  validate(getTaskActivitiesSchema),
  verifyTaskAccess,
  getTaskActivities,
);

export default router;
