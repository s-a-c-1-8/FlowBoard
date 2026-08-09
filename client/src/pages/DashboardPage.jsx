import { useEffect, useState } from "react";

import {
  getDashboardSummary,
  getMonthlyAnalytics,
  getMyTasks,
  getProductivityStatistics,
  getRecentActivities,
  getTaskPriorityStatistics,
  getTaskStatusStatistics,
} from "../features/dashboard/dashboardService.js";

import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusStats, setStatusStats] = useState(null);
  const [priorityStats, setPriorityStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          summaryResponse,
          statusResponse,
          priorityResponse,
          myTasksResponse,
          activitiesResponse,
          productivityResponse,
          monthlyResponse,
        ] = await Promise.all([
          getDashboardSummary(),
          getTaskStatusStatistics(),
          getTaskPriorityStatistics(),
          getMyTasks(),
          getRecentActivities(),
          getProductivityStatistics(),
          getMonthlyAnalytics(),
        ]);

        setSummary(summaryResponse.data.summary);
        setStatusStats(statusResponse.data.statistics);
        setPriorityStats(priorityResponse.data.statistics);
        setMyTasks(myTasksResponse.data.tasks || []);
        setRecentActivities(activitiesResponse.data.activities || []);

        setProductivity(productivityResponse.data.productivity || []);

        setMonthlyAnalytics(monthlyResponse.data.analytics || []);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statusChartData = [
    {
      name: "Todo",
      value: statusStats?.todo ?? 0,
    },
    {
      name: "In Progress",
      value: statusStats?.["in-progress"] ?? 0,
    },
    {
      name: "In Review",
      value: statusStats?.["in-review"] ?? 0,
    },
    {
      name: "Blocked",
      value: statusStats?.blocked ?? 0,
    },
    {
      name: "Done",
      value: statusStats?.done ?? 0,
    },
  ];

  const priorityChartData = [
    {
      name: "Low",
      tasks: priorityStats?.low ?? 0,
    },
    {
      name: "Medium",
      tasks: priorityStats?.medium ?? 0,
    },
    {
      name: "High",
      tasks: priorityStats?.high ?? 0,
    },
    {
      name: "Urgent",
      tasks: priorityStats?.urgent ?? 0,
    },
  ];

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your workspaces, projects, tasks, and recent activity."
      />

      {/* Summary */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Workspaces</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.workspaceCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.projectCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {summary.taskCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {summary.completedTasks}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {summary.pendingTasks}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {summary.overdueTasks}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Unread Notifications
          </p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {summary.unreadNotifications}
          </p>
        </Card>
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Task Status
            </h2>
            <p className="text-sm text-slate-500">
              Distribution of tasks by current status.
            </p>
          </div>

          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  label
                />

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Task Priority
            </h2>
            <p className="text-sm text-slate-500">
              Number of tasks grouped by priority.
            </p>
          </div>

          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Tasks + Activities */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">My Tasks</h2>
            <p className="text-sm text-slate-500">
              Tasks currently assigned to you.
            </p>
          </div>

          {myTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">
                No tasks assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {task.title}
                      </h3>

                      {task.project && (
                        <p className="mt-1 text-sm text-slate-500">
                          {task.project.name || "Unknown project"}
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={
                        task.priority === "urgent"
                          ? "danger"
                          : task.priority === "high"
                            ? "warning"
                            : "default"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="primary">{task.status}</Badge>

                    {task.dueDate && (
                      <span className="text-xs text-slate-500">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
            <p className="text-sm text-slate-500">
              Latest activity across your accessible workspaces.
            </p>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {activity.message}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {activity.actor && <span>{activity.actor.name}</span>}

                    <span>•</span>

                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Analytics */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Productivity
            </h2>
            <p className="text-sm text-slate-500">
              Completed tasks during the last 7 days.
            </p>
          </div>

          <div className="space-y-3">
            {productivity.slice(-7).map((item) => (
              <div
                key={item.date}
                className="flex flex-col gap-1 rounded-lg bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-slate-600">
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString()}
                </span>

                <span className="font-semibold text-slate-900">
                  {item.completedTasks}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Monthly Analytics
            </h2>
            <p className="text-sm text-slate-500">
              Task creation and completion by month.
            </p>
          </div>

          {monthlyAnalytics.length === 0 ? (
            <p className="text-sm text-slate-500">No monthly analytics yet.</p>
          ) : (
            <div className="space-y-3">
              {monthlyAnalytics.map((item) => (
                <div
                  key={`${item.year}-${item.month}`}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {item.month}/{item.year}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Created</p>

                      <p className="text-xl font-semibold text-slate-900">
                        {item.tasksCreated}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Completed</p>

                      <p className="text-xl font-semibold text-emerald-600">
                        {item.tasksCompleted}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};

export default DashboardPage;
