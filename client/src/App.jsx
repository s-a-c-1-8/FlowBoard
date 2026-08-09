import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import WorkspacesPage from "./pages/WorkspacesPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import TaskPage from "./pages/TaskPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/tasks/:taskId" element={<TaskPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
};

export default App;
