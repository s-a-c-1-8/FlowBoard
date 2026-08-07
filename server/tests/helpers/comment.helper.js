import request from "supertest";
import app from "../../src/app.js";

export const createComment = async ({ token, taskId, comment = {} }) => {
  const response = await request(app)
    .post(`/api/comments/tasks/${taskId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      content: "This is a test comment.",
      ...comment,
    });

  return {
    response,
    comment: response.body.data?.comment,
  };
};
