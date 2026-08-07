import {
  archiveTaskService,
  createTaskService,
  getProjectTasksService,
  getTaskByIdService,
  updateTaskAssigneeService,
  updateTaskService,
  updateTaskStatusService,
} from "../services/task.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createTask = asyncHandler(async (req, res) => {
  const task = await createTaskService({
    project: req.project,
    workspace: req.workspace,
    currentUser: req.user,
    taskData: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { task }, "Task created successfully"));
});

export const getProjectTasks = asyncHandler(async (req, res) => {
  const result = await getProjectTasksService({
    projectId: req.project._id,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tasks retrieved successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await getTaskByIdService({
    task: req.task,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task retrieved successfully"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await updateTaskService({
    task: req.task,
    workspace: req.workspace,
    currentUser: req.user,
    taskData: req.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task updated successfully"));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await updateTaskStatusService({
    task: req.task,
    currentUser: req.user,
    status: req.body.status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task status updated successfully"));
});

export const updateTaskAssignee = asyncHandler(async (req, res) => {
  const task = await updateTaskAssigneeService({
    task: req.task,
    workspace: req.workspace,
    currentUser: req.user,
    assignedTo: req.body.assignedTo,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { task },
        req.body.assignedTo
          ? "Task assigned successfully"
          : "Task unassigned successfully",
      ),
    );
});

export const archiveTask = asyncHandler(async (req, res) => {
  const task = await archiveTaskService({
    task: req.task,
    currentUser: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { task }, "Task archived successfully"));
});