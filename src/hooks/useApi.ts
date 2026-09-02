import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Minimal GET hook — re-fetches whenever `path` changes and exposes a manual
 * refresh for screens that mutate data (holidays, new appointments).
 */
export function useApi<T>(path: string) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const data = await api.get<T>(path);
        if (signal?.aborted) return;
        setState({ data, loading: false, error: null });
      } catch (error) {
        if (signal?.aborted) return;
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : "Something went wrong",
        });
      }
    },
    [path],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return { ...state, refresh };
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | AI Career Advisor`;
  }, [title]);
}
