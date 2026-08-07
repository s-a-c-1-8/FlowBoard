import request from "supertest";
import app from "../../src/app.js";

export const createProject = async ({ token, workspaceId, project = {} }) => {
  const response = await request(app)
    .post(`/api/projects/workspaces/${workspaceId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Project Management SaaS",
      description: "Main project for testing",
      status: "active",
      priority: "high",
      ...project,
    });

  return {
    response,
    project: response.body.data?.project,
  };
};
