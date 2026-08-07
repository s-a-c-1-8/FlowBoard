import Task from "../models/task.model.js";
import Workspace from "../models/workspace.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyTaskAccess = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const workspace = await Workspace.findById(task.workspace);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const currentUserId = req.user._id.toString();

  const isOwner = workspace.owner.toString() === currentUserId;

  const member = workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === currentUserId,
  );

  if (!isOwner && !member) {
    throw new ApiError(403, "You do not have access to this task");
  }

  req.task = task;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? "owner" : member.role;

  next();
});
