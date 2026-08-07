import Notification from "../models/notification.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Activity from "../models/activity.model.js";
import { TASK_STATUS } from "../constants/task.constants.js";
import { TASK_PRIORITY } from "../constants/task.constants.js";
import { createPaginationMeta, getPagination } from "../utils/pagination.js";
import { getAccessibleWorkspaceIds } from "../utils/workspaceAccess.js";

export const getDashboardSummaryService = async ({ userId }) => {
  /*
   * Find all workspaces that the user owns or belongs to.
   */
  const workspaceIds = await getAccessibleWorkspaceIds({
    userId,
  });

  /*
   * Run independent queries concurrently.
   */
  const [projectCount, taskStatistics, unreadNotifications] = await Promise.all(
    [
      Project.countDocuments({
        workspace: { $in: workspaceIds },
        isArchived: false,
      }),

      Task.aggregate([
        {
          $match: {
            workspace: {
              $in: workspaceIds,
            },
            isArchived: false,
          },
        },
        {
          $facet: {
            totalTasks: [
              {
                $count: "count",
              },
            ],

            completedTasks: [
              {
                $match: {
                  status: TASK_STATUS.DONE,
                },
              },
              {
                $count: "count",
              },
            ],

            pendingTasks: [
              {
                $match: {
                  status: {
                    $ne: TASK_STATUS.DONE,
                  },
                },
              },
              {
                $count: "count",
              },
            ],

            overdueTasks: [
              {
                $match: {
                  dueDate: {
                    $ne: null,
                    $lt: new Date(),
                  },
                  status: {
                    $ne: TASK_STATUS.DONE,
                  },
                },
              },
              {
                $count: "count",
              },
            ],
          },
        },
      ]),

      Notification.countDocuments({
        recipient: userId,
        isRead: false,
      }),
    ],
  );

  const statistics = taskStatistics[0] ?? {};

  const getFacetCount = (facet) => {
    return facet?.[0]?.count ?? 0;
  };

  return {
    workspaceCount: workspaceIds.length,
    projectCount,
    taskCount: getFacetCount(statistics.totalTasks),
    completedTasks: getFacetCount(statistics.completedTasks),
    pendingTasks: getFacetCount(statistics.pendingTasks),
    overdueTasks: getFacetCount(statistics.overdueTasks),
    unreadNotifications,
  };
};

export const getTaskStatusStatisticsService = async ({ userId }) => {
  const workspaceIds = await getAccessibleWorkspaceIds({
    userId,
  });

  const results = await Task.aggregate([
    {
      $match: {
        workspace: {
          $in: workspaceIds,
        },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const statistics = {
    [TASK_STATUS.TODO]: 0,
    [TASK_STATUS.IN_PROGRESS]: 0,
    [TASK_STATUS.IN_REVIEW]: 0,
    [TASK_STATUS.DONE]: 0,
    [TASK_STATUS.BLOCKED]: 0,
  };

  results.forEach((item) => {
    statistics[item._id] = item.count;
  });

  return statistics;
};

export const getTaskPriorityStatisticsService = async ({ userId }) => {
 const workspaceIds = await getAccessibleWorkspaceIds({
   userId,
 });

  const results = await Task.aggregate([
    {
      $match: {
        workspace: {
          $in: workspaceIds,
        },
        isArchived: false,
      },
    },
    {
      $group: {
        _id: "$priority",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const statistics = {
    [TASK_PRIORITY.LOW]: 0,
    [TASK_PRIORITY.MEDIUM]: 0,
    [TASK_PRIORITY.HIGH]: 0,
    [TASK_PRIORITY.URGENT]: 0,
  };

  results.forEach((item) => {
    statistics[item._id] = item.count;
  });

  return statistics;
};

export const getMyTasksService = async ({ userId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    assignedTo: userId,
    isArchived: false,
  };

  const conditions = [];

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.search) {
    conditions.push({
      $or: [
        {
          title: {
            $regex: query.search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: query.search,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: query.search,
            $options: "i",
          },
        },
      ],
    });
  }

  if (query.overdue === true) {
    conditions.push({
      dueDate: {
        $ne: null,
        $lt: new Date(),
      },
      status: {
        $ne: TASK_STATUS.DONE,
      },
    });
  }

  if (query.overdue === false) {
    conditions.push({
      $or: [
        {
          dueDate: null,
        },
        {
          dueDate: {
            $gte: new Date(),
          },
        },
        {
          status: TASK_STATUS.DONE,
        },
      ],
    });
  }

  if (conditions.length > 0) {
    filter.$and = conditions;
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const sort = {
    [query.sortBy]: sortDirection,
  };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate({
        path: "workspace",
        select: "name",
      })
      .populate({
        path: "project",
        select: "name status priority",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};
export const getRecentActivitiesService = async ({ userId }) => {
  const workspaceIds = await getAccessibleWorkspaceIds({
    userId,
  });

  const activities = await Activity.aggregate([
    {
      $match: {
        workspace: {
          $in: workspaceIds,
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "users",
        localField: "actor",
        foreignField: "_id",
        as: "actor",
      },
    },

    {
      $lookup: {
        from: "tasks",
        localField: "task",
        foreignField: "_id",
        as: "task",
      },
    },

    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },

    {
      $unwind: "$actor",
    },

    {
      $unwind: "$task",
    },

    {
      $unwind: "$project",
    },

    {
      $project: {
        _id: 0,
        id: {
          $toString: "$_id",
        },

        type: 1,
        message: 1,
        metadata: 1,
        createdAt: 1,

        actor: {
          id: {
            $toString: "$actor._id",
          },
          name: "$actor.name",
          email: "$actor.email",
        },

        task: {
          id: {
            $toString: "$task._id",
          },
          title: "$task.title",
          status: "$task.status",
          priority: "$task.priority",
        },

        project: {
          id: {
            $toString: "$project._id",
          },
          name: "$project.name",
        },
      },
    },
  ]);

  return activities;
};

export const getProjectStatisticsService = async ({ userId }) => {
  const workspaceIds = await getAccessibleWorkspaceIds({
    userId,
  });

  const projects = await Project.aggregate([
    {
      $match: {
        workspace: {
          $in: workspaceIds,
        },
        isArchived: false,
      },
    },

    {
      $lookup: {
        from: "tasks",

        let: {
          projectId: "$_id",
        },

        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$project", "$$projectId"],
              },

              isArchived: false,
            },
          },
        ],

        as: "tasks",
      },
    },

    {
      $addFields: {
        totalTasks: {
          $size: "$tasks",
        },
      },
    },

    {
      $addFields: {
        completedTasks: {
          $size: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: {
                $eq: ["$$task.status", TASK_STATUS.DONE],
              },
            },
          },
        },
      },
    },

    {
      $addFields: {
        pendingTasks: {
          $subtract: ["$totalTasks", "$completedTasks"],
        },
      },
    },

    {
      $addFields: {
        completionPercentage: {
          $cond: [
            {
              $eq: ["$totalTasks", 0],
            },
            0,
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: ["$completedTasks", "$totalTasks"],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          ],
        },
      },
    },

    {
      $project: {
        _id: 0,

        id: {
          $toString: "$_id",
        },

        name: 1,
        description: 1,
        status: 1,
        priority: 1,
        startDate: 1,
        dueDate: 1,

        totalTasks: 1,
        completedTasks: 1,
        pendingTasks: 1,
        completionPercentage: 1,
      },
    },

    {
      $sort: {
        completionPercentage: -1,
      },
    },
  ]);

  return projects;
};
export const getRecentNotificationsService = async ({ userId, limit = 5 }) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({
      recipient: userId,
    })
      .populate({
        path: "sender",
        select: "name email",
      })
      .populate({
        path: "workspace",
        select: "name",
      })
      .populate({
        path: "project",
        select: "name",
      })
      .populate({
        path: "task",
        select: "title status priority",
      })
      .sort({
        createdAt: -1,
      })
      .limit(limit),

    Notification.countDocuments({
      recipient: userId,
      isRead: false,
    }),
  ]);

  return {
    notifications,
    unreadCount,
  };
};

export const getProductivityStatisticsService = async ({
  userId,
  days = 30,
}) => {
  const workspaceIds = await getAccessibleWorkspaceIds({
    userId,
  });

  const startDate = new Date();

  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const results = await Task.aggregate([
    {
      $match: {
        workspace: {
          $in: workspaceIds,
        },
        isArchived: false,
        status: TASK_STATUS.DONE,
        completedAt: {
          $ne: null,
          $gte: startDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$completedAt",
            timezone: "UTC",
          },
        },
        completedTasks: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const countsByDate = new Map(
    results.map((item) => [item._id, item.completedTasks]),
  );

  const productivity = [];

  for (let index = 0; index < days; index += 1) {
    const currentDate = new Date(startDate);

    currentDate.setUTCDate(startDate.getUTCDate() + index);

    const date = currentDate.toISOString().slice(0, 10);

    productivity.push({
      date,
      completedTasks: countsByDate.get(date) ?? 0,
    });
  }

  return {
    days,
    startDate: productivity[0]?.date ?? null,
    endDate: productivity[productivity.length - 1]?.date ?? null,
    productivity,
  };
};

export const getMonthlyAnalyticsService = async ({ userId, months = 12 }) => {
const workspaceIds = await getAccessibleWorkspaceIds({
  userId,
});

  const startDate = new Date();

  startDate.setUTCDate(1);
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCMonth(startDate.getUTCMonth() - (months - 1));

  const [createdTasks, completedTasks] = await Promise.all([
    Task.aggregate([
      {
        $match: {
          workspace: {
            $in: workspaceIds,
          },
          isArchived: false,
          createdAt: {
            $gte: startDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },
          tasksCreated: {
            $sum: 1,
          },
        },
      },
    ]),

    Task.aggregate([
      {
        $match: {
          workspace: {
            $in: workspaceIds,
          },
          isArchived: false,
          status: TASK_STATUS.DONE,
          completedAt: {
            $ne: null,
            $gte: startDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$completedAt",
            },
            month: {
              $month: "$completedAt",
            },
          },
          tasksCompleted: {
            $sum: 1,
          },
        },
      },
    ]),
  ]);

  const analyticsMap = new Map();

  createdTasks.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;

    analyticsMap.set(key, {
      year: item._id.year,
      month: item._id.month,
      tasksCreated: item.tasksCreated,
      tasksCompleted: 0,
    });
  });

  completedTasks.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;

    if (analyticsMap.has(key)) {
      analyticsMap.get(key).tasksCompleted = item.tasksCompleted;
    } else {
      analyticsMap.set(key, {
        year: item._id.year,
        month: item._id.month,
        tasksCreated: 0,
        tasksCompleted: item.tasksCompleted,
      });
    }
  });

  return Array.from(analyticsMap.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
};