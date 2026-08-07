export const USER_BASIC_POPULATE = Object.freeze({
  path: "user",
  select: "name email",
});

export const TASK_POPULATE = Object.freeze([
  {
    path: "workspace",
    select: "name description",
  },
  {
    path: "project",
    select: "name status priority isArchived",
  },
  {
    path: "assignedTo",
    select: "name email",
  },
  {
    path: "createdBy",
    select: "name email",
  },
]);

export const TASK_SUMMARY_POPULATE = Object.freeze([
  {
    path: "project",
    select: "name status priority isArchived",
  },
  {
    path: "assignedTo",
    select: "name email",
  },
  {
    path: "createdBy",
    select: "name email",
  },
]);

export const COMMENT_POPULATE = Object.freeze([
  {
    path: "author",
    select: "name email",
  },
  {
    path: "task",
    select: "title status priority",
  },
]);

export const PROJECT_POPULATE = Object.freeze([
  {
    path: "workspace",
    select: "name description",
  },
  {
    path: "createdBy",
    select: "name email",
  },
]);

export const INVITATION_POPULATE = Object.freeze([
  {
    path: "workspace",
    select: "name description",
  },
  {
    path: "invitedBy",
    select: "name email",
  },
  {
    path: "invitedUser",
    select: "name email",
  },
]);

export const NOTIFICATION_POPULATE = Object.freeze([
  {
    path: "sender",
    select: "name email",
  },
  {
    path: "workspace",
    select: "name",
  },
  {
    path: "project",
    select: "name",
  },
  {
    path: "task",
    select: "title status priority",
  },
]);
