import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import LoginPage from "@/pages/Login";
import DashboardPage from "@/pages/Dashboard";
import AvailabilityPage from "@/pages/Availability";
import ClientRecordsPage from "@/pages/ClientRecords";
import ClientDetailsPage from "@/pages/ClientDetails";
import ConsultsPage from "@/pages/Consults";
import OnlineConsultPage from "@/pages/OnlineConsult";
import ProfilePage from "@/pages/Profile";
import HelpPage from "@/pages/Help";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route index element={<DashboardPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="client-records" element={<ClientRecordsPage />} />
          <Route path="client-records/:key" element={<ClientDetailsPage />} />
            <Route path="consults" element={<ConsultsPage />} />
            <Route path="online-consult" element={<OnlineConsultPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
