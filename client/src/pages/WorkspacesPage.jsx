import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";

import {
  createWorkspace,
  getWorkspaces,
} from "../features/workspaces/workspaceService.js";

import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Badge from "../components/ui/Badge.jsx";

const WorkspacesPage = () => {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getWorkspaces();

        setWorkspaces(response.data.workspaces);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (event) => {
    event.preventDefault();

    if (!name.trim()) return;

    try {
      setCreating(true);
      setError("");

      const response = await createWorkspace({
        name: name.trim(),
      });

      const newWorkspace = response.data.workspace;

      setWorkspaces((previous) => [newWorkspace, ...previous]);

      setName("");
      setShowCreateForm(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-sm text-slate-500">Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Manage the teams and spaces you collaborate in."
        action={
          <Button onClick={() => setShowCreateForm(true)}>
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Create Workspace
            </span>
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Create Workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a workspace for your team, project, or organization.
            </p>
          </div>

          <form
            onSubmit={handleCreateWorkspace}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Workspace name"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Workspace"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {workspaces.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Users size={22} />
            </div>

            <h3 className="font-semibold text-slate-900">No workspaces yet</h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create your first workspace to start organizing projects and
              tasks.
            </p>

            <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
              Create Workspace
            </Button>
          </div>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => {
            const currentMembership = workspace.members?.find(
              (member) =>
                member.user?.id === workspace.owner ||
                member.user === workspace.owner,
            );

            return (
              <Card
                key={workspace.id}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {workspace.name}
                      </h2>

                      {workspace.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {workspace.description}
                        </p>
                      )}
                    </div>

                    <Badge variant="primary">
                      {currentMembership?.role || "workspace"}
                    </Badge>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Users size={16} />

                    <span>{workspace.members?.length || 0} members</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    to={`/workspaces/${workspace.id}`}
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                  >
                    View Workspace →
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default WorkspacesPage;
