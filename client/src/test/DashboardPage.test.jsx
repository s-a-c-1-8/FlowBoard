import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import DashboardPage from "../pages/DashboardPage.jsx";

vi.mock("../features/dashboard/dashboardService.js", () => ({
  getDashboardSummary: vi.fn(),
  getTaskStatusStatistics: vi.fn(),
  getTaskPriorityStatistics: vi.fn(),
  getMyTasks: vi.fn(),
  getRecentActivities: vi.fn(),
  getProductivityStatistics: vi.fn(),
  getMonthlyAnalytics: vi.fn(),
}));

import {
  getDashboardSummary,
  getTaskStatusStatistics,
  getTaskPriorityStatistics,
  getMyTasks,
  getRecentActivities,
  getProductivityStatistics,
  getMonthlyAnalytics,
} from "../features/dashboard/dashboardService.js";

describe("DashboardPage", () => {
  it("should render dashboard data", async () => {
    getDashboardSummary.mockResolvedValue({
      data: {
        summary: {
          workspaceCount: 2,
          projectCount: 3,
          taskCount: 5,
          completedTasks: 2,
          pendingTasks: 3,
          overdueTasks: 1,
          unreadNotifications: 4,
        },
      },
    });

    getTaskStatusStatistics.mockResolvedValue({
      data: {
        statistics: {
          todo: 2,
          "in-progress": 1,
          "in-review": 0,
          blocked: 0,
          done: 2,
        },
      },
    });

    getTaskPriorityStatistics.mockResolvedValue({
      data: {
        statistics: {
          low: 1,
          medium: 2,
          high: 2,
          urgent: 0,
        },
      },
    });

    getMyTasks.mockResolvedValue({
      data: {
        tasks: [],
      },
    });

    getRecentActivities.mockResolvedValue({
      data: {
        activities: [],
      },
    });

    getProductivityStatistics.mockResolvedValue({
      data: {
        productivity: [],
      },
    });

    getMonthlyAnalytics.mockResolvedValue({
      data: {
        analytics: [],
      },
    });

    render(<DashboardPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Dashboard",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Workspaces")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("should show loading state while dashboard data is loading", () => {
    getDashboardSummary.mockImplementation(() => new Promise(() => {}));

    getTaskStatusStatistics.mockImplementation(() => new Promise(() => {}));

    getTaskPriorityStatistics.mockImplementation(() => new Promise(() => {}));

    getMyTasks.mockImplementation(() => new Promise(() => {}));

    getRecentActivities.mockImplementation(() => new Promise(() => {}));

    getProductivityStatistics.mockImplementation(() => new Promise(() => {}));

    getMonthlyAnalytics.mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it("should show an error when dashboard loading fails", async () => {
    getDashboardSummary.mockRejectedValue({
      response: {
        data: {
          message: "Failed to fetch dashboard",
        },
      },
    });

    getTaskStatusStatistics.mockResolvedValue({
      data: { statistics: {} },
    });

    getTaskPriorityStatistics.mockResolvedValue({
      data: { statistics: {} },
    });

    getMyTasks.mockResolvedValue({
      data: { tasks: [] },
    });

    getRecentActivities.mockResolvedValue({
      data: { activities: [] },
    });

    getProductivityStatistics.mockResolvedValue({
      data: { productivity: [] },
    });

    getMonthlyAnalytics.mockResolvedValue({
      data: { analytics: [] },
    });

    render(<DashboardPage />);

    expect(
      await screen.findByText("Failed to fetch dashboard"),
    ).toBeInTheDocument();
  });
  
});
