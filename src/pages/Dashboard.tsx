import { DashboardView } from "@/components/dashboard/DashboardView";
import { usePageTitle } from "@/hooks/useApi";

export default function DashboardPage() {
  usePageTitle("Dashboard");
  return <DashboardView />;
}
