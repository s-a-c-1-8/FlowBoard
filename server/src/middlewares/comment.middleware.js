import Comment from "../models/comment.model.js";
import Workspace from "../models/workspace.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyCommentAccess = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const workspace = await Workspace.findById(comment.workspace);

  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  const currentUserId = req.user._id.toString();

  const isOwner = workspace.owner.toString() === currentUserId;

  const member = workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === currentUserId,
  );

  if (!isOwner && !member) {
    throw new ApiError(403, "You do not have access to this comment");
  }

  req.comment = comment;
  req.workspace = workspace;
  req.workspaceRole = isOwner ? "owner" : member.role;

  next();
});
