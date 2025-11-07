import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

interface User {
  id: string;
  email: string | null;
  emailVerified: boolean;
}

type UseAuthState = {
  user: User | null;
  loading: boolean;
  error?: string;
};

export function useAuth(): UseAuthState {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const session = await apiFetch<{
          user_id: string;
          email?: string | null;
        }>("/api/auth/session", { cache: "no-store" });

        if (!mounted) return;

        setState({
          user: {
            id: session.user_id,
            email: session.email ?? null,
            emailVerified: Boolean(session.email),
          },
          loading: false,
        });
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ user: null, loading: false });
          return;
        }
        setState({
          user: null,
          loading: false,
          error:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Authentication check failed",
        });
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
