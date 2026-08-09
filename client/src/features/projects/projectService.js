import api from "../../api/axios.js";

export const getWorkspaceProjects = async (workspaceId) => {
  const response = await api.get(`/projects/workspaces/${workspaceId}`);

  return response.data;
};

export const createProject = async (workspaceId, projectData) => {
  const response = await api.post(
    `/projects/workspaces/${workspaceId}`,
    projectData,
  );

  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);

  return response.data;
};
