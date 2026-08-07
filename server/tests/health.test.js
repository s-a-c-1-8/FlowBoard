import request from "supertest";
import app from "../src/app.js";

describe("Health Check API", () => {
  it("should return server health successfully", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
