import { beforeEach, describe, expect, it } from "vitest";

import authReducer, {
  logout,
  setCredentials,
} from "../features/auth/authSlice.js";

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return the initial unauthenticated state", () => {
    const state = authReducer(undefined, {
      type: "unknown",
    });

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should set user credentials", () => {
    const payload = {
      user: {
        id: "1",
        name: "Sachin",
        email: "sachin@example.com",
        role: "member",
      },
      token: "test-token",
    };

    const state = authReducer(undefined, setCredentials(payload));

    expect(state.user).toEqual(payload.user);
    expect(state.token).toBe("test-token");
    expect(state.isAuthenticated).toBe(true);
  });

  it("should logout the user and clear localStorage", () => {
    const initialState = {
      user: {
        id: "1",
        name: "Sachin",
      },
      token: "test-token",
      isAuthenticated: true,
    };

    localStorage.setItem("token", "test-token");
    localStorage.setItem("user", JSON.stringify(initialState.user));

    const state = authReducer(initialState, logout());

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
