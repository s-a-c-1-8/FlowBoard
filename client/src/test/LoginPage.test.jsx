import { describe, expect, it, vi } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginPage from "../pages/LoginPage.jsx";
import authReducer from "../features/auth/authSlice.js";

vi.mock("../features/auth/authService.js", () => ({
  loginUser: vi.fn(),
}));

import { loginUser } from "../features/auth/authService.js";

describe("LoginPage", () => {
  it("should login user successfully", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      data: {
        user: {
          id: "1",
          name: "Sachin",
          email: "sachin@example.com",
          role: "member",
        },
        token: "test-token",
      },
    });

    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    );

    await user.type(screen.getByLabelText(/email/i), "sachin@example.com");

    await user.type(screen.getByLabelText(/password/i), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    expect(loginUser).toHaveBeenCalledWith({
      email: "sachin@example.com",
      password: "Password123",
    });
  });
  it("should show an error when login fails", async () => {
    const user = userEvent.setup();

    loginUser.mockRejectedValue({
      response: {
        data: {
          message: "Invalid email or password",
        },
      },
    });

    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    );

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");

    await user.type(screen.getByLabelText(/password/i), "WrongPassword123");

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();

    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("should show loading state while login is in progress", async () => {
    const user = userEvent.setup();

    let resolveLogin;

    loginUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    const store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    );

    await user.type(screen.getByLabelText(/email/i), "sachin@example.com");

    await user.type(screen.getByLabelText(/password/i), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /sign in/i,
      }),
    );

    expect(
      screen.getByRole("button", {
        name: /signing in/i,
      }),
    ).toBeDisabled();

    resolveLogin({
      data: {
        user: {
          id: "1",
          name: "Sachin",
          email: "sachin@example.com",
          role: "member",
        },
        token: "test-token",
      },
    });
  });
  
});
