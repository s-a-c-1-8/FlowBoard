import api from "../../api/axios.js";

export const getProjectTasks = async (projectId) => {
  const response = await api.get(`/tasks/projects/${projectId}`);

  return response.data;
};

export const createTask = async (projectId, taskData) => {
  const response = await api.post(`/tasks/projects/${projectId}`, taskData);

  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);

  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status });

  return response.data;
};

export const updateTaskAssignee = async (taskId, assignedTo) => {
  const response = await api.patch(`/tasks/${taskId}/assignee`, {
    assignedTo,
  });

  return response.data;
};