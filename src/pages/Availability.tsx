import { AvailabilityView } from "@/components/availability/AvailabilityView";
import { usePageTitle } from "@/hooks/useApi";

export default function AvailabilityPage() {
  usePageTitle("My Availability");
  return <AvailabilityView />;
}
