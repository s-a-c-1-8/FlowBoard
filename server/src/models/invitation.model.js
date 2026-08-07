import mongoose from "mongoose";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";
import { INVITATION_STATUS } from "../constants/invitation.constants.js";
import { WORKSPACE_ROLE } from "../constants/workspace.constants.js";

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: WORKSPACE_ROLE.MEMBER,
    },

    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
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

invitationSchema.index({
  workspace: 1,
  email: 1,
  status: 1,
});

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
