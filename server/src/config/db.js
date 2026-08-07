import mongoose from "mongoose";

const connectDatabase = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    throw new Error("MongoDB connection URI is missing");
  }

  const connection = await mongoose.connect(uri);

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`,
    );
  }

  return connection;
};

export default connectDatabase;
