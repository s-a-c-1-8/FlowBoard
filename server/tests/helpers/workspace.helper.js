import request from "supertest";
import app from "../../src/app.js";
import { TEST_WORKSPACE } from "./testData.js";

export const createWorkspace = async ({ token, workspace = {} }) => {
  const response = await request(app)
    .post("/api/workspaces")
    .set("Authorization", `Bearer ${token}`)
    .send({
      ...TEST_WORKSPACE,
      ...workspace,
    });

  return {
    response,
    workspace: response.body.data?.workspace,
  };
};
