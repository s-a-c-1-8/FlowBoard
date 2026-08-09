import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock3, Plus, ListTodo } from "lucide-react";

import { getProjectById } from "../features/projects/projectService.js";
import { createTask, getProjectTasks } from "../features/tasks/taskService.js";

import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";

const ProjectPage = () => {
  const { projectId } = useParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    estimatedHours: "",
  });

  const [creatingTask, setCreatingTask] = useState(false);
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProjectById(projectId);

        setProject(response.data.project);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        setTaskError("");

        const response = await getProjectTasks(projectId);
        setTasks(response.data.tasks);
      } catch (error) {
        setTaskError(error.response?.data?.message || "Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!project) {
    return <p>Project not found.</p>;
  }

  const workspaceId = project.workspace?.id || project.workspace;

  const workspaceName = project.workspace?.name || "Workspace";
  const handleTaskChange = (event) => {
    const { name, value } = event.target;

    setTaskForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    try {
      setCreatingTask(true);
      setTaskError("");

      const payload = {
        ...taskForm,
        estimatedHours: taskForm.estimatedHours
          ? Number(taskForm.estimatedHours)
          : undefined,
        dueDate: taskForm.dueDate || undefined,
      };

      const response = await createTask(projectId, payload);

      const newTask = response.data.task;

      setTasks((previous) => [newTask, ...previous]);

      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        estimatedHours: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      setTaskError(error.response?.data?.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };
  return (
    <div className="space-y-5 sm:space-y-6">
      <Breadcrumbs
        items={[
          {
            label: "Workspaces",
            to: "/workspaces",
          },
          {
            label: workspaceName,
            to: `/workspaces/${workspaceId}`,
          },
          {
            label: project.name,
          },
        ]}
      />
      <PageHeader
        title={project.name}
        description={
          project.description ||
          "Track tasks, priorities, and progress for this project."
        }
        action={
          <Button onClick={() => setShowCreateForm(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Create Task
            </span>
          </Button>
        }
      />

      {/* Project overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-slate-500">Status</p>

          <div className="mt-3">
            <Badge variant="primary">{project.status}</Badge>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Priority</p>

          <div className="mt-3">
            <Badge
              variant={
                project.priority === "urgent"
                  ? "danger"
                  : project.priority === "high"
                    ? "warning"
                    : "default"
              }
            >
              {project.priority}
            </Badge>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Tasks</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ListTodo size={20} />
            </div>

            <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
          </div>
        </Card>
      </section>

      {/* Create task */}
      {showCreateForm && (
        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Create Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a task to this project and define its priority, due date, and
              estimated effort.
            </p>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Task title
              </label>

              <input
                type="text"
                name="title"
                value={taskForm.title}
                onChange={handleTaskChange}
                placeholder="e.g. Build dashboard filters"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={taskForm.description}
                onChange={handleTaskChange}
                placeholder="Describe the task..."
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due date
                </label>

                <input
                  type="date"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Estimated hours
                </label>

                <input
                  type="number"
                  name="estimatedHours"
                  value={taskForm.estimatedHours}
                  onChange={handleTaskChange}
                  placeholder="8"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={creatingTask}
                className="w-full sm:w-auto"
              >
                {creatingTask ? "Creating..." : "Create Task"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowCreateForm(false);

                  setTaskForm({
                    title: "",
                    description: "",
                    priority: "medium",
                    dueDate: "",
                    estimatedHours: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {taskError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {taskError}
        </div>
      )}

      {/* Tasks */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>

          <p className="mt-1 text-sm text-slate-500">
            Tasks currently tracked under this project.
          </p>
        </div>

        {tasksLoading ? (
          <Card>
            <p className="text-sm text-slate-500">Loading tasks...</p>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <ListTodo size={22} />
              </div>

              <h3 className="font-semibold text-slate-900">No tasks yet</h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Create your first task to start tracking work for this project.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => (
              <Card key={task.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        to={`/tasks/${task.id}`}
                        className="break-words text-lg font-semibold text-slate-900 transition hover:text-indigo-600"
                      >
                        {task.title}
                      </Link>

                      {task.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {task.description}
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

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{task.status}</Badge>

                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays size={14} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    {task.estimatedHours && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 size={14} />
                        {task.estimatedHours}h
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    View Task →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProjectPage;
