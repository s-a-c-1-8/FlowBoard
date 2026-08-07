import request from "supertest";
import app from "../../src/app.js";

export const createTask = async ({ token, projectId, task = {} }) => {
  const response = await request(app)
    .post(`/api/tasks/projects/${projectId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Build authentication UI",
      description: "Create login and registration screens",
      status: "todo",
      priority: "high",
      dueDate: "2026-08-20",
      estimatedHours: 8,
      tags: ["React", "Authentication"],
      ...task,
    });

  return {
    response,
    task: response.body.data?.task,
  };
};
