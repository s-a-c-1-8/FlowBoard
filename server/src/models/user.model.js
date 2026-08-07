import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { mongooseJSONTransform } from "../utils/mongooseTransform.js";
import { WORKSPACE_ROLE } from "../constants/workspace.constants.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must contain at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: WORKSPACE_ROLE.MEMBER,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(document, returnedObject) {
        mongooseJSONTransform(document, returnedObject);

        delete returnedObject.password;
        delete returnedObject.refreshToken;

        return returnedObject;
      },
    },

    toObject: {
      virtuals: true,
      transform(document, returnedObject) {
        mongooseJSONTransform(document, returnedObject);

        delete returnedObject.password;
        delete returnedObject.refreshToken;

        return returnedObject;
      },
    },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
