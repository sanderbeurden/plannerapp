import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: "idle" | "loading";
  signIn: (email: string, password: string) => Promise<{ ok: boolean }>;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("loading");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = (await response.json()) as { user?: AuthUser };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { ok: false };
      }

      let data: { user?: AuthUser };
      try {
        data = await response.json();
      } catch {
        return { ok: false };
      }

      if (!data.user) {
        return { ok: false };
      }

      setUser(data.user);

      return { ok: true };
    } catch {
      return { ok: false };
    } finally {
      setStatus("idle");
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setStatus("loading");
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          return { ok: false };
        }

        let data: { user?: AuthUser };
        try {
          data = await response.json();
        } catch {
          return { ok: false };
        }

        if (!data.user) {
          return { ok: false };
        }

        setUser(data.user);
        return { ok: true };
      } catch {
        return { ok: false };
      } finally {
        setStatus("idle");
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [user, status, signIn, signUp, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
