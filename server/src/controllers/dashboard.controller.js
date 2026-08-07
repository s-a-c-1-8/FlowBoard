import {
  getRecentActivitiesService,
  getDashboardSummaryService,
  getMyTasksService,
  getProjectStatisticsService,
  getTaskPriorityStatisticsService,
  getTaskStatusStatisticsService,
  getRecentNotificationsService,
  getProductivityStatisticsService,
  getMonthlyAnalyticsService,
} from "../services/dashboard.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummaryService({
    userId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { summary },
        "Dashboard summary retrieved successfully",
      ),
    );
});

export const getTaskStatusStatistics = asyncHandler(async (req, res) => {
  const statistics = await getTaskStatusStatisticsService({
    userId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { statistics },
        "Task status statistics retrieved successfully",
      ),
    );
});
export const getTaskPriorityStatistics = asyncHandler(async (req, res) => {
  const statistics = await getTaskPriorityStatisticsService({
    userId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { statistics },
        "Task priority statistics retrieved successfully",
      ),
    );
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const result = await getMyTasksService({
    userId: req.user._id,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "My tasks retrieved successfully"));
});

export const getRecentActivities = asyncHandler(async (req, res) => {
  const activities = await getRecentActivitiesService({
    userId: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { activities },
        "Recent activities retrieved successfully",
      ),
    );
});

export const getProjectStatistics = asyncHandler(async (req, res) => {
  const statistics = await getProjectStatisticsService({
    userId: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        statistics,
      },
      "Project statistics retrieved successfully",
    ),
  );
});

export const getRecentNotifications = asyncHandler(async (req, res) => {
  const result = await getRecentNotificationsService({
    userId: req.user._id,
    limit: 5,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Recent notifications retrieved successfully",
      ),
    );
});

export const getProductivityStatistics = asyncHandler(async (req, res) => {
  const result = await getProductivityStatisticsService({
    userId: req.user._id,
    days: 30,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Productivity statistics retrieved successfully",
      ),
    );
});

export const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getMonthlyAnalyticsService({
    userId: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        analytics,
      },
      "Monthly analytics retrieved successfully",
    ),
  );
});