import { TASK_STATUS } from "../constants/task.constants.js";

export const applyTaskCompletionStatus = ({ task, newStatus }) => {
  task.status = newStatus;

  task.completedAt = newStatus === TASK_STATUS.DONE ? new Date() : null;
};
