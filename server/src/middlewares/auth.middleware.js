import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token is required");
  }

  const token = authorizationHeader.split(" ")[1];

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Authentication token has expired");
    }

    throw new ApiError(401, "Invalid authentication token");
  }

  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new ApiError(401, "User associated with this token no longer exists");
  }

  req.user = user;

  next();
});
