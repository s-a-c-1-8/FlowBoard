import Comment from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import { createPaginationMeta, getPagination } from "../utils/pagination.js";
import { ACTIVITY_TYPE } from "../constants/activity.constants.js";
import { createActivityService } from "./activity.service.js";
import { COMMENT_POPULATE } from "../constants/populate.constants.js";

export const createCommentService = async ({ task, currentUser, content }) => {
  if (task.isArchived) {
    throw new ApiError(400, "Comments cannot be added to an archived task");
  }

  const comment = await Comment.create({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    author: currentUser._id,
    content,
  });

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.COMMENT_ADDED,
    message: `${currentUser.name} added a comment`,
    metadata: {
      commentId: comment._id,
    },
  });

  await comment.populate(COMMENT_POPULATE);

  return comment;
};

export const getTaskCommentsService = async ({ taskId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    task: taskId,
    //     isDeleted: false,
  };

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate({
        path: "author",
        select: "name email",
      })
      .sort({
        createdAt: sortDirection,
      })
      .skip(skip)
      .limit(limit),

    Comment.countDocuments(filter),
  ]);

  return {
    comments,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};

export const updateCommentService = async ({
  comment,
  currentUser,
  content,
}) => {
  if (comment.isDeleted) {
    throw new ApiError(400, "Deleted comments cannot be edited");
  }

  const isAuthor = comment.author.toString() === currentUser._id.toString();

  if (!isAuthor) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  if (comment.content === content) {
    throw new ApiError(400, "No comment changes were detected");
  }

  const previousContent = comment.content;

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();

  await comment.save();

  await createActivityService({
    workspace: comment.workspace,
    project: comment.project,
    task: comment.task,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.COMMENT_UPDATED,
    message: `${currentUser.name} edited a comment`,
    metadata: {
      commentId: comment._id,
      previousContent,
      newContent: content,
    },
  });

  await comment.populate(COMMENT_POPULATE);

  return comment;
};

export const deleteCommentService = async ({
  comment,
  currentUser,
  workspaceRole,
}) => {
  if (comment.isDeleted) {
    throw new ApiError(400, "Comment is already deleted");
  }

  const isAuthor = comment.author.toString() === currentUser._id.toString();

  const canModerate = workspaceRole === "owner" || workspaceRole === "admin";

  if (!isAuthor && !canModerate) {
    throw new ApiError(
      403,
      "You do not have permission to delete this comment",
    );
  }

  const previousContent = comment.content;

  comment.content = "This comment was deleted";
  comment.isDeleted = true;
  comment.deletedAt = new Date();

  await comment.save();

  await createActivityService({
    workspace: comment.workspace,
    project: comment.project,
    task: comment.task,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.COMMENT_DELETED,
    message: `${currentUser.name} deleted a comment`,
    metadata: {
      commentId: comment._id,
      previousContent,
      deletedByRole: workspaceRole,
    },
  });

  await comment.populate({
    path: "author",
    select: "name email",
  });

  return comment;
};