import mongoose from "mongoose";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";
import { WORKSPACE_ROLE } from "../constants/workspace.constants.js";

const workspaceMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(WORKSPACE_ROLE),
      default: WORKSPACE_ROLE.MEMBER,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      minlength: [2, "Workspace name must contain at least 2 characters"],
      maxlength: [80, "Workspace name cannot exceed 80 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Workspace description cannot exceed 300 characters"],
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: {
      type: [workspaceMemberSchema],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
   {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: mongooseJSONTransform,
    },

    toObject: {
      virtuals: true,
      transform: mongooseJSONTransform,
    },
  },
);

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ "members.user": 1 });

const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;
