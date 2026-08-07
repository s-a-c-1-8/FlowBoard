import Workspace from "../models/workspace.model.js";

export const getAccessibleWorkspaceIds = async ({
  userId,
  includeArchived = false,
}) => {
  const filter = {
    $or: [{ owner: userId }, { "members.user": userId }],
  };

  if (!includeArchived) {
    filter.isArchived = false;
  }

  const workspaces = await Workspace.find(filter).select("_id").lean();

  return workspaces.map((workspace) => workspace._id);
};
