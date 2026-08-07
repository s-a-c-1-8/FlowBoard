import express from "express";
import {
  getAllUsers,
  getCurrentUser,
  getManagementDashboard,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import authorizeGlobalRoles from "../middlewares/global-role.middleware.js";

const router = express.Router();

router.get("/profile", protect, getCurrentUser);

router.get("/", protect, authorizeGlobalRoles("admin"), getAllUsers);

router.get(
  "/management-dashboard",
  protect,
  authorizeGlobalRoles("admin", "member"),
  getManagementDashboard,
);
export default router;
