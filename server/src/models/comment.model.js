import mongoose from "mongoose";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";

const commentSchema = new mongoose.Schema(
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

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
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

commentSchema.index({
  task: 1,
  createdAt: -1,
});

commentSchema.index({
  workspace: 1,
  author: 1,
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
