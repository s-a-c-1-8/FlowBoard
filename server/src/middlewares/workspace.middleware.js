import Workspace from "../models/workspace.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyWorkspaceMember = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const currentUserId = req.user._id.toString();

  const isOwner = workspace.owner.toString() === currentUserId;

  const member = workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === currentUserId,
  );

  if (!isOwner && !member) {
    throw new ApiError(403, "You do not have access to this workspace");
  }

  req.workspace = workspace;

  req.workspaceRole = isOwner ? "owner" : member.role;

  next();
});

export const requireWorkspaceRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      throw new ApiError(403, "Workspace membership could not be verified");
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this workspace action",
      );
    }

    next();
  };
};
