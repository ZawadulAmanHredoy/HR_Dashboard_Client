import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import DashboardPage from "@/pages/Dashboard";

/**
 * Where "/" lands. Admins run the review console rather than a consultant
 * dashboard, so they are sent straight to it; everyone else sees the dashboard.
 */
export function HomeRoute() {
  const { user } = useAuth();
  if (user?.isAdmin) return <Navigate to="/admin" replace />;
  return <DashboardPage />;
}
