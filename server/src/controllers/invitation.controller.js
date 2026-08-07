import {
  acceptInvitationService,
  cancelInvitationService,
  createInvitationService,
  getMyInvitationsService,
  getWorkspaceInvitationsService,
  rejectInvitationService,
} from "../services/invitation.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createWorkspaceInvitation = asyncHandler(async (req, res) => {
  const { email, role } = req.body;

  const invitation = await createInvitationService({
    workspace: req.workspace,
    workspaceRole: req.workspaceRole,
    invitedBy: req.user._id,
    email,
    role,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { invitation },
        "Workspace invitation created successfully",
      ),
    );
});

export const getMyInvitations = asyncHandler(async (req, res) => {
  const result = await getMyInvitationsService({
    userId: req.user._id,
    email: req.user.email,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Invitations retrieved successfully"));
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await acceptInvitationService({
    invitationId: req.params.invitationId,
    currentUser: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Invitation accepted successfully"));
});

export const rejectInvitation = asyncHandler(async (req, res) => {
  const invitation = await rejectInvitationService({
    invitationId: req.params.invitationId,
    currentUser: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { invitation }, "Invitation rejected successfully"),
    );
});

export const getWorkspaceInvitations = asyncHandler(async (req, res) => {
  const result = await getWorkspaceInvitationsService({
    workspaceId: req.params.workspaceId,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Workspace invitations retrieved successfully",
      ),
    );
});

export const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await cancelInvitationService({
    workspaceId: req.params.workspaceId,
    invitationId: req.params.invitationId,
    workspaceRole: req.workspaceRole,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { invitation }, "Invitation cancelled successfully"),
    );
});