import api from "../../api/axios.js";

export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};

export const getTaskStatusStatistics = async () => {
  const response = await api.get("/dashboard/task-status");
  return response.data;
};

export const getTaskPriorityStatistics = async () => {
  const response = await api.get("/dashboard/task-priority");
  return response.data;
};

export const getMyTasks = async () => {
  const response = await api.get("/dashboard/my-tasks");
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await api.get("/dashboard/recent-activities");

  return response.data;
};

export const getProductivityStatistics = async () => {
  const response = await api.get("/dashboard/productivity");
  return response.data;
};

export const getMonthlyAnalytics = async () => {
  const response = await api.get("/dashboard/monthly-analytics");
  return response.data;
};