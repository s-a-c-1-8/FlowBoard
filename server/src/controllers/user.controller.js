import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getCurrentUser = asyncHandler(async (req, res) => {
  const responseData = {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "User profile retrieved successfully"),
    );
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        count: users.length,
      },
      "Users retrieved successfully",
    ),
  );
});

export const getManagementDashboard = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: req.user.name,
        role: req.user.role,
      },
      "Management dashboard accessed successfully",
    ),
  );
});