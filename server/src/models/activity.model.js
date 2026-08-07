import mongoose from "mongoose";
import { ACTIVITY_TYPE } from "../constants/activity.constants.js";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";

const activitySchema = new mongoose.Schema(
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

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(ACTIVITY_TYPE),
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

activitySchema.index({
  createdAt: -1,
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
