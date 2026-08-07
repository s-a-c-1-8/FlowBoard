import Project from "../models/project.model.js";
import Workspace from "../models/workspace.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyProjectAccess = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const workspace = await Workspace.findById(project.workspace);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const currentUserId = req.user._id.toString();

  const isOwner = workspace.owner.toString() === currentUserId;

  const member = workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === currentUserId,
  );

  if (!isOwner && !member) {
    throw new ApiError(403, "You do not have access to this project");
  }

  req.project = project;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? "owner" : member.role;

  next();
});
