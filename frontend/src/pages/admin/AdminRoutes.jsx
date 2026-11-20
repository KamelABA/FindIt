// Every /admin page. Loaded on demand (see App.jsx): visitors never download the dashboard.
// AdminLayout protects all of them: nothing renders until the backend confirms an admin account.
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import OverviewPage from "./OverviewPage";
import UsersPage from "./UsersPage";
import ItemsPage from "./ItemsPage";
import ClaimsPage from "./ClaimsPage";
import ReportsPage from "./ReportsPage";
import ActivityLogsPage from "./ActivityLogsPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="lost" element={<ItemsPage key="lost" type="lost" />} />
        <Route path="found" element={<ItemsPage key="found" type="found" />} />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="logs" element={<ActivityLogsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
