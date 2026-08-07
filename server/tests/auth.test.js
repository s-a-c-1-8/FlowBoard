import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/user.model.js";

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    const invalidRegistrationCases = [
      {
        title: "missing name",
        payload: {
          email: "test@example.com",
          password: "password123",
        },
      },
      {
        title: "invalid email",
        payload: {
          name: "Test User",
          email: "invalid-email",
          password: "password123",
        },
      },
      {
        title: "missing password",
        payload: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      {
        title: "short password",
        payload: {
          name: "Test User",
          email: "test@example.com",
          password: "123",
        },
      },
    ];

    it.each(invalidRegistrationCases)(
      "should reject registration with $title",
      async ({ payload }) => {
        const response = await request(app)
          .post("/api/auth/register")
          .send(payload);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Request validation failed");
        expect(response.body.errors.length).toBeGreaterThan(0);
      },
    );
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "Sachin Test",
        email: "sachintest@example.com",
        password: "Password123",
      });
      
      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Registration successful");

      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          name: "Sachin Test",
          email: "sachintest@example.com",
          role: "member",
        }),
      );

      expect(response.body.data.user.password).toBeUndefined();

      const userInDatabase = await User.findOne({
        email: "sachintest@example.com",
      }).select("+password");

      expect(userInDatabase).not.toBeNull();
      expect(userInDatabase.password).not.toBe("password123");
    });
    it("should reject registration with an existing email", async () => {
      await request(app).post("/api/auth/register").send({
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
      });

      const response = await request(app).post("/api/auth/register").send({
        name: "Another User",
        email: "existing@example.com",
        password: "password456",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Request validation failed");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        name: "Login User",
        email: "login@example.com",
        password: "Password123",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "Password123",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          name: "Login User",
          email: "login@example.com",
          role: "member",
        }),
      );

      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should reject login with an incorrect password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject login for an unknown email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "password123",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it.each([
      {
        title: "missing email",
        payload: {
          password: "password123",
        },
      },
      {
        title: "missing password",
        payload: {
          email: "login@example.com",
        },
      },
      {
        title: "invalid email",
        payload: {
          email: "invalid-email",
          password: "password123",
        },
      },
    ])("should reject login with $title", async ({ payload }) => {
      const response = await request(app).post("/api/auth/login").send(payload);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });
});
