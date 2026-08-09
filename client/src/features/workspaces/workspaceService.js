import api from "../../api/axios.js";

export const getWorkspaces = async () => {
  const response = await api.get("/workspaces");

  return response.data;
};

export const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);

  return response.data;
};

export const getWorkspaceById = async (workspaceId) => {
  const response = await api.get(`/workspaces/${workspaceId}`);

  return response.data;
};
