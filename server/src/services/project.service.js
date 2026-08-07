import Project from "../models/project.model.js";
import ApiError from "../utils/ApiError.js";

import { createPaginationMeta, getPagination } from "../utils/pagination.js";
import { PROJECT_POPULATE } from "../constants/populate.constants.js";

export const createProjectService = async ({
  workspace,
  currentUser,
  projectData,
}) => {
  const existingProject = await Project.findOne({
    workspace: workspace._id,
    name: projectData.name,
    isArchived: false,
  });

  if (existingProject) {
    throw new ApiError(
      409,
      "A project with this name already exists in the workspace",
    );
  }

  const project = await Project.create({
    workspace: workspace._id,
    name: projectData.name,
    description: projectData.description,
    status: projectData.status,
    priority: projectData.priority,
    startDate: projectData.startDate ?? null,
    dueDate: projectData.dueDate ?? null,
    createdBy: currentUser._id,
  });

  await project.populate(PROJECT_POPULATE);

  return project;
};

export const getWorkspaceProjectsService = async ({ workspaceId, query }) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const filter = {
    workspace: workspaceId,
    isArchived: query.isArchived,
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.search) {
    filter.$or = [
      {
        name: {
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
    ];
  }

  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const sort = {
    [query.sortBy]: sortDirection,
  };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Project.countDocuments(filter),
  ]);

  return {
    projects,
    pagination: createPaginationMeta({
      page,
      limit,
      total,
    }),
  };
};

export const getProjectByIdService = async ({ project }) => {
  await project.populate(PROJECT_POPULATE);

  return project;
};

export const updateProjectService = async ({ project, projectData }) => {
  if (projectData.name && projectData.name !== project.name) {
    const duplicateProject = await Project.findOne({
      workspace: project.workspace,
      name: projectData.name,
      isArchived: false,
      _id: {
        $ne: project._id,
      },
    });

    if (duplicateProject) {
      throw new ApiError(
        409,
        "A project with this name already exists in the workspace",
      );
    }
  }

  const allowedFields = [
    "name",
    "description",
    "status",
    "priority",
    "startDate",
    "dueDate",
  ];

  allowedFields.forEach((field) => {
    if (projectData[field] !== undefined) {
      project[field] = projectData[field];
    }
  });

  const finalStartDate = project.startDate;
  const finalDueDate = project.dueDate;

  if (finalStartDate && finalDueDate && finalDueDate < finalStartDate) {
    throw new ApiError(400, "Due date cannot be earlier than start date");
  }

  await project.save();

  await project.populate(PROJECT_POPULATE);

  return project;
};

export const archiveProjectService = async ({ project }) => {
  if (project.isArchived) {
    throw new ApiError(400, "Project is already archived");
  }

  project.isArchived = true;

  await project.save();

  return project;
};