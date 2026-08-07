import request from "supertest";
import app from "../../src/app.js";

export const assignTaskToUser = async ({ token, taskId, userId }) => {
  const response = await request(app)
    .patch(`/api/tasks/${taskId}/assignee`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      assignedTo: userId,
    });

  return response;
};
