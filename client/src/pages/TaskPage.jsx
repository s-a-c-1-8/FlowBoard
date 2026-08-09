import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getTaskById,
  updateTaskAssignee,
  updateTaskStatus,
} from "../features/tasks/taskService.js";

import { getWorkspaceById } from "../features/workspaces/workspaceService.js";
import { useSelector } from "react-redux";

import {
  createComment,
  deleteComment,
  getTaskComments,
  updateComment,
} from "../features/comments/commentService.js";
import { CalendarDays, Clock3, MessageSquare, UserRound } from "lucide-react";

import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Breadcrumbs from "../components/ui/Breadcrumbs.jsx";

const TaskPage = () => {
  const { taskId } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [members, setMembers] = useState([]);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState("");

  const [commentText, setCommentText] = useState("");
  const [creatingComment, setCreatingComment] = useState(false);

  const currentUser = useSelector((state) => state.auth.user);

  const [editingCommentId, setEditingCommentId] = useState(null);

  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getTaskById(taskId);

        setTask(response.data.task);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  useEffect(() => {
    if (!task) return;

    const fetchMembers = async () => {
      try {
        const workspaceId = task.workspace?.id || task.workspace;

        const response = await getWorkspaceById(workspaceId);

        setMembers(response.data.workspace.members || []);
      } catch (error) {
        throw new Error(
          error.response?.data?.message || "Failed to load workspace members",
        );
      }
    };

    fetchMembers();
  }, [task]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        setCommentError("");

        const response = await getTaskComments(taskId);

        setComments(response.data.comments);
      } catch (error) {
        setCommentError(
          error.response?.data?.message || "Failed to load comments",
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  if (loading) {
    return <p>Loading task...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!task) {
    return <p>Task not found.</p>;
  }

  
  const workspaceId = task.workspace?.id || task.workspace;

  const workspaceName = task.workspace?.name || "Workspace";

  const projectId = task.project?.id || task.project;

  const projectName = task.project?.name || "Project";
  
  const handleAssigneeChange = async (event) => {
    const assignedTo = event.target.value || null;

    try {
      setUpdatingAssignee(true);
      setError("");

      const response = await updateTaskAssignee(taskId, assignedTo);

      setTask(response.data.task);
    } catch (error) {
      

      setError(
        error.response?.data?.message || "Failed to update task assignee",
      );
    } finally {
      setUpdatingAssignee(false);
    }
  };
  const handleStatusChange = async (event) => {
    const status = event.target.value;

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await updateTaskStatus(taskId, status);

      const updatedTask = response.data.task;

      setTask(updatedTask);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update task status");
    } finally {
      setUpdatingStatus(false);
    }
  };
  const handleCreateComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) return;

    try {
      setCreatingComment(true);
      setCommentError("");

      const response = await createComment(taskId, commentText.trim());

      const newComment = response.data.comment;

      setComments((previous) => [newComment, ...previous]);

      setCommentText("");
    } catch (error) {
      setCommentError(
        error.response?.data?.message || "Failed to create comment",
      );
    } finally {
      setCreatingComment(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) return;

    try {
      setCommentError("");

      const response = await updateComment(commentId, editingContent.trim());

      const updatedComment = response.data.comment;

      setComments((previous) =>
        previous.map((comment) =>
          comment.id === commentId ? updatedComment : comment,
        ),
      );

      handleCancelEdit();
    } catch (error) {
      setCommentError(
        error.response?.data?.message || "Failed to update comment",
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setCommentError("");

      await deleteComment(commentId);

      setComments((previous) =>
        previous.filter((comment) => comment.id !== commentId),
      );
    } catch (error) {
      setCommentError(
        error.response?.data?.message || "Failed to delete comment",
      );
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
            label: projectName,
            to: `/projects/${projectId}`,
          },
          {
            label: task.title,
          },
        ]}
      />
      <PageHeader
        title={task.title}
        description={
          task.description ||
          "Manage this task's status, assignment, and collaboration."
        }
      />

      {/* Task details */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Status</p>

          <select
            value={task.status}
            onChange={handleStatusChange}
            disabled={updatingStatus}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>

          {updatingStatus && (
            <p className="mt-2 text-xs text-slate-500">Updating...</p>
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Assigned To</p>

          <select
            value={task.assignedTo?.id || ""}
            onChange={handleAssigneeChange}
            disabled={updatingAssignee}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Unassigned</option>

            {members
              .filter((member) => member.user)
              .map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name} ({member.role})
                </option>
              ))}
          </select>

          {updatingAssignee && (
            <p className="mt-2 text-xs text-slate-500">Updating...</p>
          )}
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Priority</p>

          <div className="mt-3">
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
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Effort</p>

          <div className="mt-3 flex items-center gap-2">
            <Clock3 size={18} className="text-slate-400" />

            <span className="font-semibold text-slate-900">
              {task.estimatedHours
                ? `${task.estimatedHours}h`
                : "Not estimated"}
            </span>
          </div>
        </Card>
      </section>

      {/* Extra metadata */}
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarDays size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">Due date</p>

              <p className="font-medium text-slate-900">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <UserRound size={18} />
            </div>

            <div>
              <p className="text-xs text-slate-500">Current assignee</p>

              <p className="break-words font-medium text-slate-900">
                {task.assignedTo?.name || "Unassigned"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-slate-500" />

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Comments</h2>

            <p className="text-sm text-slate-500">
              Discuss progress and updates for this task.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleCreateComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <Button
              type="submit"
              disabled={creatingComment}
              className="w-full sm:w-auto"
            >
              {creatingComment ? "Posting..." : "Add Comment"}
            </Button>
          </form>
        </Card>

        {commentError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {commentError}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {commentsLoading ? (
            <Card>
              <p className="text-sm text-slate-500">Loading comments...</p>
            </Card>
          ) : comments.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">No comments yet.</p>
            </Card>
          ) : (
            comments.map((comment) => {
              const isAuthor = comment.author?.id === currentUser?.id;

              const isEditing = editingCommentId === comment.id;

              return (
                <Card key={comment.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {comment.author?.name || "Unknown User"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(comment.createdAt).toLocaleString()}
                        {comment.isEdited && " · edited"}
                      </p>
                    </div>

                    {isAuthor && !isEditing && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleStartEdit(comment)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(event) =>
                          setEditingContent(event.target.value)
                        }
                        rows={3}
                        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleUpdateComment(comment.id)}>
                          Save
                        </Button>

                        <Button variant="secondary" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {comment.content}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default TaskPage;
