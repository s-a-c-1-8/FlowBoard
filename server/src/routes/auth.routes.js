/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sachin
 *               email:
 *                 type: string
 *                 example: sachin@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation failed
 *       409:
 *         description: User already exists
 */

import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), loginUser);

export default router;
