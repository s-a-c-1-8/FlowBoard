import {
  archiveProjectService,
  createProjectService,
  getProjectByIdService,
  getWorkspaceProjectsService,
  updateProjectService,
} from "../services/project.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createProject = asyncHandler(async (req, res) => {
  const project = await createProjectService({
    workspace: req.workspace,
    currentUser: req.user,
    projectData: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { project }, "Project created successfully"));
});

export const getWorkspaceProjects = asyncHandler(async (req, res) => {
  const result = await getWorkspaceProjectsService({
    workspaceId: req.params.workspaceId,
    query: req.validatedQuery,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Projects retrieved successfully"));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await getProjectByIdService({
    project: req.project,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { project }, "Project retrieved successfully"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await updateProjectService({
    project: req.project,
    projectData: req.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { project }, "Project updated successfully"));
});
export const archiveProject = asyncHandler(async (req, res) => {
  const project = await archiveProjectService({
    project: req.project,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { project }, "Project archived successfully"));
});