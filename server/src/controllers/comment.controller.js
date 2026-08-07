import {
  createCommentService,
  deleteCommentService,
  getTaskCommentsService,
  updateCommentService,
} from "../services/comment.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createComment = asyncHandler(async (req, res) => {
  const comment = await createCommentService({
    task: req.task,
    currentUser: req.user,
    content: req.body.content,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { comment }, "Comment added successfully"));
});

export const getTaskComments = asyncHandler(async (req, res) => {
  const result = await getTaskCommentsService({
    taskId: req.task._id,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments retrieved successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await updateCommentService({
    comment: req.comment,
    currentUser: req.user,
    content: req.body.content,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await deleteCommentService({
    comment: req.comment,
    currentUser: req.user,
    workspaceRole: req.workspaceRole,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { comment }, "Comment deleted successfully"));
});