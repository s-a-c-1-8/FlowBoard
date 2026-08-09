import api from "../../api/axios.js";

export const getTaskComments = async (taskId) => {
  const response = await api.get(`/comments/tasks/${taskId}`);

  return response.data;
};

export const createComment = async (taskId, content) => {
  const response = await api.post(`/comments/tasks/${taskId}`, { content });

  return response.data;
};

export const updateComment = async (commentId, content) => {
  const response = await api.patch(`/comments/${commentId}`, { content });

  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);

  return response.data;
};