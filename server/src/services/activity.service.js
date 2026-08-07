import Activity from "../models/activity.model.js";

import { createPaginationMeta, getPagination } from "../utils/pagination.js";

export const createActivityService = async ({
  workspace,
  project,
  task,
  actor,
  type,
  message,
  metadata = {},
  session = null,
}) => {
  const activityData = {
    workspace,
    project,
    task,
    actor,
    type,
    message,
    metadata,
  };

  if (session) {
    const [activity] = await Activity.create([activityData], { session });

    return activity;
  }

  return Activity.create(activityData);
};

export const getTaskActivitiesService = async ({ taskId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const filter = {
    task: taskId,
  };

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate({
        path: "actor",
        select: "name email",
      })
      .sort({
        createdAt: sortDirection,
      })
      .skip(skip)
      .limit(limit),

    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};