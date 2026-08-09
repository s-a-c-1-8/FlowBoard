import { describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import ProtectedRoute from "../routes/ProtectedRoute.jsx";
import authReducer from "../features/auth/authSlice.js";

const renderProtectedRoute = (preloadedState) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Route>

          <Route path="/login" element={<h1>Login Page</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe("ProtectedRoute", () => {
  it("should render protected content when user is authenticated", () => {
    renderProtectedRoute({
      auth: {
        user: {
          id: "1",
          name: "Sachin",
        },
        token: "test-token",
        isAuthenticated: true,
      },
    });

    expect(
      screen.getByRole("heading", {
        name: "Dashboard",
      }),
    ).toBeInTheDocument();
  });

  it("should redirect to login when user is not authenticated", () => {
    renderProtectedRoute({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      },
    });

    expect(
      screen.getByRole("heading", {
        name: "Login Page",
      }),
    ).toBeInTheDocument();
  });
});
