import request from "supertest";
import app from "../../src/app.js";
import { TEST_PASSWORD } from "./testData.js";

let counter = 0;

export const registerUser = async (overrides = {}) => {
  counter++;

  const payload = {
    name: "Test User",
    email: `user${counter}@example.com`,
    password: TEST_PASSWORD,
    ...overrides,
  };

  const response = await request(app).post("/api/auth/register").send(payload);

  return {
    response,
    user: response.body.data?.user,
    token: response.body.data?.token,
    payload,
  };
};
