import Task from "../models/task.model.js";
import ApiError from "../utils/ApiError.js";
import { createPaginationMeta, getPagination } from "../utils/pagination.js";
import { ACTIVITY_TYPE } from "../constants/activity.constants.js";
import { createActivityService } from "./activity.service.js";
import { NOTIFICATION_TYPE } from "../constants/notification.constants.js";
import { createNotificationService } from "./notification.service.js";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.constants.js";
import { areArraysEqual, areValuesEqual } from "../utils/changeDetection.js";
import { applyTaskCompletionStatus } from "../utils/taskStatus.js";
import { TASK_POPULATE, TASK_SUMMARY_POPULATE } from "../constants/populate.constants.js";

export const createTaskService = async ({
  project,
  workspace,
  currentUser,
  taskData,
}) => {
  if (project.isArchived) {
    throw new ApiError(
      400,
      "Tasks cannot be created inside an archived project",
    );
  }

  if (taskData.assignedTo) {
    const assigneeId = taskData.assignedTo.toString();

    const isWorkspaceOwner = workspace.owner.toString() === assigneeId;

    const isWorkspaceMember = workspace.members.some(
      (member) => member.user.toString() === assigneeId,
    );

    if (!isWorkspaceOwner && !isWorkspaceMember) {
      throw new ApiError(
        400,
        "Task can only be assigned to a workspace member",
      );
    }
  }

  const normalizedTags = [
    ...new Set(taskData.tags.map((tag) => tag.toLowerCase())),
  ];

  const task = await Task.create({
    workspace: workspace._id,
    project: project._id,
    title: taskData.title,
    description: taskData.description,
    status: taskData.status,
    priority: taskData.priority,
    assignedTo: taskData.assignedTo ?? null,
    createdBy: currentUser._id,
    dueDate: taskData.dueDate ?? null,
    completedAt: taskData.status === TASK_STATUS.DONE ? new Date() : null,
    estimatedHours: taskData.estimatedHours ?? null,
    tags: normalizedTags,
  });

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.TASK_CREATED,
    message: `${currentUser.name} created the task`,
    metadata: {
      title: task.title,
      status: task.status,
      priority: task.priority,
    },
  });

  await task.populate(TASK_SUMMARY_POPULATE);

  return task;
};

export const getProjectTasksService = async ({ projectId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    project: projectId,
    isArchived: query.isArchived,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.search) {
    filter.$or = [
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
    ];
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const sort = {
    [query.sortBy]: sortDirection,
  };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate({
        path: "assignedTo",
        select: "name email",
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

export const getTaskByIdService = async ({ task }) => {
  await task.populate(TASK_POPULATE);

  return task;
};

export const updateTaskService = async ({
  task,
  workspace,
  currentUser,
  taskData,
}) => {
  if (task.isArchived) {
    throw new ApiError(400, "Archived tasks cannot be updated");
  }

  const updatedFields = [];

  if (taskData.assignedTo !== undefined) {
    const previousAssigneeId = task.assignedTo?.toString() ?? null;

    const newAssigneeId = taskData.assignedTo?.toString() ?? null;

    if (previousAssigneeId !== newAssigneeId) {
      if (taskData.assignedTo === null) {
        task.assignedTo = null;
      } else {
        const isWorkspaceOwner = workspace.owner.toString() === newAssigneeId;

        const isWorkspaceMember = workspace.members.some(
          (member) => member.user.toString() === newAssigneeId,
        );

        if (!isWorkspaceOwner && !isWorkspaceMember) {
          throw new ApiError(
            400,
            "Task can only be assigned to a workspace member",
          );
        }

        task.assignedTo = taskData.assignedTo;
      }

      updatedFields.push("assignedTo");
    }
  }

  const allowedFields = [
    "title",
    "description",
    "priority",
    "dueDate",
    "estimatedHours",
  ];

  allowedFields.forEach((field) => {
    if (
      taskData[field] !== undefined &&
      !areValuesEqual(task[field], taskData[field])
    ) {
      task[field] = taskData[field];
      updatedFields.push(field);
    }
  });

  if (taskData.tags !== undefined) {
    const normalizedTags = [
      ...new Set(taskData.tags.map((tag) => tag.toLowerCase())),
    ];

    if (!areArraysEqual(task.tags, normalizedTags)) {
      task.tags = normalizedTags;
      updatedFields.push("tags");
    }
  }
  if (updatedFields.length === 0) {
    throw new ApiError(400, "No task changes were detected");
  }

  if (
    taskData.status !== undefined &&
    !areValuesEqual(task.status, taskData.status)
  ) {
    applyTaskCompletionStatus({
      task,
      newStatus: taskData.status,
    });

    updatedFields.push("status");
  }

  await task.save();

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.TASK_UPDATED,
    message: `${currentUser.name} updated the task`,
    metadata: {
      updatedFields,
    },
  });
  await task.populate(TASK_SUMMARY_POPULATE);

  return task;
};

export const updateTaskStatusService = async ({
  task,
  currentUser,
  status,
}) => {
  if (task.isArchived) {
    throw new ApiError(400, "Archived tasks cannot be updated");
  }

  const previousStatus = task.status;

  if (previousStatus === status) {
    throw new ApiError(400, "Task already has this status");
  }

  applyTaskCompletionStatus({
    task,
    newStatus: status,
  });

  await task.save();

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.TASK_STATUS_CHANGED,
    message: `${currentUser.name} changed task status`,
    metadata: {
      oldStatus: previousStatus,
      newStatus: status,
    },
  });

  await task.populate(TASK_SUMMARY_POPULATE);

  return task;
};

export const updateTaskAssigneeService = async ({
  task,
  workspace,
  currentUser,
  assignedTo,
}) => {
  if (task.isArchived) {
    throw new ApiError(400, "Archived tasks cannot be reassigned");
  }

  const previousAssignee = task.assignedTo;
  const previousAssigneeId = previousAssignee?.toString() ?? null;
  const newAssigneeId = assignedTo?.toString() ?? null;

  if (previousAssigneeId === newAssigneeId) {
    throw new ApiError(
      400,
      assignedTo
        ? "Task is already assigned to this user"
        : "Task is already unassigned",
    );
  }

  if (assignedTo === null) {
    task.assignedTo = null;
  } else {
    const isWorkspaceOwner = workspace.owner.toString() === newAssigneeId;

    const isWorkspaceMember = workspace.members.some(
      (member) => member.user.toString() === newAssigneeId,
    );

    if (!isWorkspaceOwner && !isWorkspaceMember) {
      throw new ApiError(
        400,
        "Task can only be assigned to a workspace member",
      );
    }

    task.assignedTo = assignedTo;
  }

  await task.save();

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.TASK_ASSIGNEE_CHANGED,
    message: assignedTo
      ? `${currentUser.name} assigned the task`
      : `${currentUser.name} unassigned the task`,
    metadata: {
      oldAssignee: previousAssigneeId,
      newAssignee: newAssigneeId,
    },
  });

  if (assignedTo && assignedTo.toString() !== currentUser._id.toString()) {
    await createNotificationService({
      recipient: assignedTo,
      sender: currentUser._id,
      workspace: task.workspace,
      project: task.project,
      task: task._id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: "Task assigned to you",
      message: `${currentUser.name} assigned you the task "${task.title}"`,
      metadata: {
        taskId: task._id,
        previousAssignee: previousAssigneeId,
        newAssignee: newAssigneeId,
      },
    });
  }

  await task.populate(TASK_SUMMARY_POPULATE);

  return task;
};

export const archiveTaskService = async ({ task, currentUser }) => {
  if (task.isArchived) {
    throw new ApiError(400, "Task is already archived");
  }

  task.isArchived = true;

  await task.save();

  await createActivityService({
    workspace: task.workspace,
    project: task.project,
    task: task._id,
    actor: currentUser._id,
    type: ACTIVITY_TYPE.TASK_ARCHIVED,
    message: `${currentUser.name} archived the task`,
    metadata: {
      title: task.title,
    },
  });

  await task.populate(TASK_SUMMARY_POPULATE);

  return task;
};
