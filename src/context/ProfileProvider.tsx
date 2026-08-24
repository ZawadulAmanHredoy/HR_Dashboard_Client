import { useMemo, type ReactNode } from "react";
import { useApi } from "@/hooks/useApi";
import { endpoints, type Profile } from "@/lib/api";
import { ProfileContext } from "@/context/profile-context";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, refresh } = useApi<Profile>(endpoints.profile);

  const value = useMemo(
    () => ({ profile: data, loading, error, refresh }),
    [data, loading, error, refresh],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
