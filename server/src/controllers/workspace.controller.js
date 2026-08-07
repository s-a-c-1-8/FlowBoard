import Workspace from "../models/workspace.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user._id,
    members: [
      {
        user: req.user._id,
        role: "owner",
      },
    ],
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        workspace,
      },
      "Workspace created successfully",
    ),
  );
});

export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [
      {
        owner: req.user._id,
      },
      {
        "members.user": req.user._id,
      },
    ],
    isArchived: false,
  })
    .populate("owner", "name email")
    .populate("members.user", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        workspaces,
        count: workspaces.length,
      },
      "Workspaces retrieved successfully",
    ),
  );
});

export const getWorkspaceById = asyncHandler(async (req, res) => {
  await req.workspace.populate([
    {
      path: "owner",
      select: "name email role",
    },
    {
      path: "members.user",
      select: "name email role",
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        workspace: req.workspace,
      },
      "Workspace retrieved successfully",
    ),
  );
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (name !== undefined) {
    req.workspace.name = name;
  }

  if (description !== undefined) {
    req.workspace.description = description;
  }

  await req.workspace.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        workspace: req.workspace,
      },
      "Workspace updated successfully",
    ),
  );
});

export const addWorkspaceMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No registered user found with this email");
  }

  const userId = user._id.toString();
  const ownerId = req.workspace.owner.toString();

  if (userId === ownerId) {
    throw new ApiError(409, "Workspace owner is already a member");
  }

  const existingMember = req.workspace.members.find(
    (member) => member.user.toString() === userId,
  );

  if (existingMember) {
    throw new ApiError(409, "User is already a workspace member");
  }

  req.workspace.members.push({
    user: user._id,
    role,
  });

  await req.workspace.save();

  await req.workspace.populate({
    path: "members.user",
    select: "name email",
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        member: req.workspace.members.at(-1),
      },
      "Workspace member added successfully",
    ),
  );
});

export const updateWorkspaceMemberRole = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;

  const ownerId = req.workspace.owner.toString();
  const currentUserId = req.user._id.toString();

  if (memberId === ownerId) {
    throw new ApiError(400, "Workspace owner's role cannot be changed");
  }

  if (memberId === currentUserId) {
    throw new ApiError(400, "You cannot change your own workspace role");
  }

  const member = req.workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === memberId,
  );

  if (!member) {
    throw new ApiError(404, "Workspace member not found");
  }

  if (req.workspaceRole === "admin" && member.role === "admin") {
    throw new ApiError(403, "Workspace admins cannot manage other admins");
  }

  member.role = role;

  await req.workspace.save();

  await req.workspace.populate({
    path: "members.user",
    select: "name email",
  });

  const updatedMember = req.workspace.members.find(
    (workspaceMember) => workspaceMember.user._id.toString() === memberId,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        member: updatedMember,
      },
      "Workspace member role updated successfully",
    ),
  );
});

export const removeWorkspaceMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  const ownerId = req.workspace.owner.toString();
  const currentUserId = req.user._id.toString();

  if (memberId === ownerId) {
    throw new ApiError(400, "Workspace owner cannot be removed");
  }

  if (memberId === currentUserId) {
    throw new ApiError(400, "You cannot remove yourself using this endpoint");
  }

  const member = req.workspace.members.find(
    (workspaceMember) => workspaceMember.user.toString() === memberId,
  );

  if (!member) {
    throw new ApiError(404, "Workspace member not found");
  }

  if (req.workspaceRole === "admin" && member.role === "admin") {
    throw new ApiError(403, "Workspace admins cannot remove other admins");
  }

  req.workspace.members = req.workspace.members.filter(
    (workspaceMember) => workspaceMember.user.toString() !== memberId,
  );

  await req.workspace.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        removedMemberId: memberId,
      },
      "Workspace member removed successfully",
    ),
  );
});

export const leaveWorkspace = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();

  const ownerId = req.workspace.owner.toString();

  if (currentUserId === ownerId) {
    throw new ApiError(
      400,
      "Workspace owner cannot leave the workspace. Transfer ownership or delete the workspace first.",
    );
  }

  req.workspace.members = req.workspace.members.filter(
    (member) => member.user.toString() !== currentUserId,
  );

  await req.workspace.save();

  return res.status(200).json(
    new ApiResponse(
      200,

      null,

      "You left the workspace successfully",
    ),
  );
});