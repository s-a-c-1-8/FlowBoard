import "dotenv/config";
import mongoose from "mongoose";

import connectDatabase from "../src/config/db.js";

beforeAll(async () => {
  process.env.NODE_ENV = "test";

  if (!process.env.MONGODB_TEST_URI) {
    throw new Error("MONGODB_TEST_URI is missing from the environment");
  }

  if (process.env.MONGODB_TEST_URI === process.env.MONGODB_URI) {
    throw new Error(
      "Test database URI must not match the development database URI",
    );
  }

  await connectDatabase(process.env.MONGODB_TEST_URI);
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
