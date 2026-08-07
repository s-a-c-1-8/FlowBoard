import mongoose from "mongoose";
import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import Workspace from "../models/workspace.model.js";
import ApiError from "../utils/ApiError.js";
import { createPaginationMeta, getPagination } from "../utils/pagination.js";
import { INVITATION_STATUS } from "../constants/invitation.constants.js";
import { INVITATION_POPULATE } from "../constants/populate.constants.js";

export const createInvitationService = async ({
  workspace,
  workspaceRole,
  invitedBy,
  email,
  role,
}) => {
  if (workspaceRole === "admin" && role === "admin") {
    throw new ApiError(
      403,
      "Only the workspace owner can invite another admin",
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const existingUserId = existingUser._id.toString();

    const isOwner = workspace.owner.toString() === existingUserId;

    const isMember = workspace.members.some(
      (member) => member.user.toString() === existingUserId,
    );

    if (isOwner || isMember) {
      throw new ApiError(409, "This user is already a workspace member");
    }
  }

  const existingInvitation = await Invitation.findOne({
    workspace: workspace._id,
    email,
    status: "pending",
  });

  if (existingInvitation) {
    const isExpired = existingInvitation.expiresAt.getTime() <= Date.now();

    if (!isExpired) {
      throw new ApiError(
        409,
        "A pending invitation already exists for this email",
      );
    }

    existingInvitation.status = "expired";
    await existingInvitation.save();
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    workspace: workspace._id,
    email,
    invitedUser: existingUser?._id ?? null,
    invitedBy,
    role,
    status: "pending",
    expiresAt,
  });

  await invitation.populate([
    {
      path: "workspace",
      select: "name description",
    },
    {
      path: "invitedBy",
      select: "name email",
    },
    {
      path: "invitedUser",
      select: "name email",
    },
  ]);

  return invitation;
};

export const getMyInvitationsService = async ({ userId, email, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    $or: [
      {
        invitedUser: userId,
      },
      {
        email,
      },
    ],
  };

  if (query.status) {
    filter.status = query.status;
  }

  const [invitations, total] = await Promise.all([
    Invitation.find(filter)
      .populate({
        path: "workspace",
        select: "name description",
      })
      .populate({
        path: "invitedBy",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Invitation.countDocuments(filter),
  ]);

  return {
    invitations,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};

export const acceptInvitationService = async ({
  invitationId,
  currentUser,
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const invitation = await Invitation.findById(invitationId).session(session);

    if (!invitation) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new ApiError(400, "This invitation has already been processed");
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      invitation.status = "expired";

      await invitation.save({ session });

      throw new ApiError(400, "This invitation has expired");
    }

    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new ApiError(403, "This invitation does not belong to you");
    }

    const workspace = await Workspace.findById(invitation.workspace).session(
      session,
    );

    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const currentUserId = currentUser._id.toString();

    const isOwner = workspace.owner.toString() === currentUserId;

    const existingMember = workspace.members.find(
      (member) => member.user.toString() === currentUserId,
    );

    if (isOwner || existingMember) {
      throw new ApiError(409, "You are already a member of this workspace");
    }

    workspace.members.push({
      user: currentUser._id,
      role: invitation.role,
    });

    invitation.status = INVITATION_STATUS.ACCEPTED;
    invitation.invitedUser = currentUser._id;

    await workspace.save({ session });
    await invitation.save({ session });

    await session.commitTransaction();

    await workspace.populate([
      {
        path: "owner",
        select: "name email",
      },
      {
        path: "members.user",
        select: "name email",
      },
    ]);

    return {
      invitation,
      workspace,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const rejectInvitationService = async ({
  invitationId,
  currentUser,
}) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, "This invitation has already been processed");
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "This invitation has expired");
  }

  if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
    throw new ApiError(403, "This invitation does not belong to you");
  }

  invitation.status = "rejected";
  invitation.invitedUser = currentUser._id;

  await invitation.save();

 await invitation.populate(INVITATION_POPULATE);

  return invitation;
};

export const getWorkspaceInvitationsService = async ({
  workspaceId,
  query,
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    workspace: workspaceId,
  };

  if (query.status) {
    filter.status = query.status;
  }

  const [invitations, total] = await Promise.all([
    Invitation.find(filter)
      .populate({
        path: "invitedBy",
        select: "name email",
      })
      .populate({
        path: "invitedUser",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Invitation.countDocuments(filter),
  ]);

  return {
    invitations,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};

export const cancelInvitationService = async ({
  workspaceId,
  invitationId,
  workspaceRole,
}) => {
  const invitation = await Invitation.findOne({
    _id: invitationId,
    workspace: workspaceId,
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, "Only pending invitations can be cancelled");
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    invitation.status = "expired";
    await invitation.save();

    throw new ApiError(400, "This invitation has already expired");
  }

  if (workspaceRole === "admin" && invitation.role === "admin") {
    throw new ApiError(403, "Workspace admins cannot cancel admin invitations");
  }

  invitation.status = "cancelled";

  await invitation.save();

  await invitation.populate(INVITATION_POPULATE);

  return invitation;
};