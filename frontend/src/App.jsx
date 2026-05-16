import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PrivateRoute, AdminRoute } from "./components/ProtectedRoutes.jsx";
import { AppLayout } from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateProject from "./pages/CreateProject.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import ManageTeam from "./pages/ManageTeam.jsx";
import CreateTask from "./pages/CreateTask.jsx";
import TaskList from "./pages/TaskList.jsx";
import Taskers from "./pages/Taskers.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import TaskStatusPage from "./pages/TaskStatusPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/:id/status" element={<TaskStatusPage />} />
            <Route path="tasks/:id" element={<TaskDetail />} />

            <Route element={<AdminRoute />}>
              <Route path="projects/create" element={<CreateProject />} />
              <Route path="projects/:projectId/team" element={<ManageTeam />} />
              <Route path="projects/:projectId/tasks/new" element={<CreateTask />} />
              <Route path="taskers" element={<Taskers />} />
            </Route>

            <Route path="projects/:id" element={<ProjectDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
