import express from "express";

import {
  createComment,
  deleteComment,
  getTaskComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { verifyTaskAccess } from "../middlewares/task.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createCommentSchema,
  deleteCommentSchema,
  getTaskCommentsSchema,
  updateCommentSchema,
} from "../validations/comment.validation.js";
import { verifyCommentAccess } from "../middlewares/comment.middleware.js";

const router = express.Router();

router
  .route("/tasks/:taskId")
  .post(protect, validate(createCommentSchema), verifyTaskAccess, createComment)
  .get(
    protect,
    validate(getTaskCommentsSchema),
    verifyTaskAccess,
    getTaskComments,
  );

router
  .route("/:commentId")
  .patch(
    protect,
    validate(updateCommentSchema),
    verifyCommentAccess,
    updateComment,
  )
  .delete(
    protect,
    validate(deleteCommentSchema),
    verifyCommentAccess,
    deleteComment,
  );

export default router;
