import mongoose from "mongoose";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.constants.js";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";

const taskSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [2, "Task title must contain at least 2 characters"],
      maxlength: [150, "Task title cannot exceed 150 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Task description cannot exceed 2000 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
      index: true,
    },

    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dueDate: {
      type: Date,
      default: null,
      index: true,
    },

    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
      max: [10000, "Estimated hours value is too large"],
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
      index: true,
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


const Task = mongoose.model("Task", taskSchema);

export default Task;
