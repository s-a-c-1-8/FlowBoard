import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FolderKanban, Plus, Users } from "lucide-react";

import { getWorkspaceById } from "../features/workspaces/workspaceService.js";

import {
  createProject,
  getWorkspaceProjects,
} from "../features/projects/projectService.js";

import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    priority: "medium",
  });

  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWorkspaceById(workspaceId);

        setWorkspace(response.data.workspace);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load workspace");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectError("");

        const response = await getWorkspaceProjects(workspaceId);

        setProjects(response.data.projects);
      } catch (error) {
        setProjectError(
          error.response?.data?.message || "Failed to load projects",
        );
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [workspaceId]);

  if (loading) {
    return <p>Loading workspace...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!workspace) {
    return <p>Workspace not found.</p>;
  }

  const handleProjectChange = (event) => {
    const { name, value } = event.target;

    setProjectForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    try {
      setCreatingProject(true);
      setProjectError("");

      const response = await createProject(workspaceId, projectForm);

      const newProject = response.data.project;

      setProjects((previous) => [newProject, ...previous]);

      setProjectForm({
        name: "",
        description: "",
        priority: "medium",
      });
      setShowCreateForm(false);
    } catch (error) {
      setProjectError(
        error.response?.data?.message || "Failed to create project",
      );
    } finally {
      setCreatingProject(false);
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
            label: workspace.name,
          },
        ]}
      />
      <PageHeader
        title={workspace.name}
        description={
          workspace.description ||
          "Manage projects and collaboration inside this workspace."
        }
        action={
          <Button onClick={() => setShowCreateForm(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Create Project
            </span>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-slate-500">Members</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users size={20} />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {workspace.members?.length || 0}
            </p>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Projects</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FolderKanban size={20} />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {projects.length}
            </p>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Workspace ID</p>

          <p className="mt-3 truncate font-mono text-sm font-medium text-slate-700">
            {workspace.id}
          </p>
        </Card>
      </section>

      {showCreateForm && (
        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Create Project
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new project to this workspace.
            </p>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Project name
              </label>

              <input
                type="text"
                name="name"
                value={projectForm.name}
                onChange={handleProjectChange}
                placeholder="e.g. FlowBoard Frontend"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={projectForm.description}
                onChange={handleProjectChange}
                placeholder="What is this project about?"
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <select
                name="priority"
                value={projectForm.priority}
                onChange={handleProjectChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={creatingProject}
                className="w-full sm:w-auto"
              >
                {creatingProject ? "Creating..." : "Create Project"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowCreateForm(false);

                  setProjectForm({
                    name: "",
                    description: "",
                    priority: "medium",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {projectError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {projectError}
        </div>
      )}

      <section>
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Projects</h2>

            <p className="mt-1 text-sm text-slate-500">
              Projects available inside this workspace.
            </p>
          </div>
        </div>

        {projectsLoading ? (
          <Card>
            <p className="text-sm text-slate-500">Loading projects...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FolderKanban size={22} />
              </div>

              <h3 className="font-semibold text-slate-900">No projects yet</h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Create a project to start planning tasks and tracking progress.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col justify-between">
                <div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-lg font-semibold text-slate-900 transition hover:text-indigo-600"
                  >
                    {project.name}
                  </Link>

                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant="primary">{project.status}</Badge>

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
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Open Project →
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

export default WorkspacePage;
