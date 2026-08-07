import { getTaskActivitiesService } from "../services/activity.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getTaskActivities = asyncHandler(async (req, res) => {
  const result = await getTaskActivitiesService({
    taskId: req.task._id,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Task activities retrieved successfully"),
    );
});
