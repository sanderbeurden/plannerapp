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
  token: string | null;
  status: "idle" | "loading";
  signIn: (email: string, password: string) => Promise<{ ok: boolean }>;
  signOut: () => void;
};

const STORAGE_TOKEN = "plannerapp.token";
const STORAGE_USER = "plannerapp.user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(STORAGE_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_TOKEN)
  );
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const signIn = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { ok: false };
      }

      let data: { token?: string; user?: AuthUser };
      try {
        data = await response.json();
      } catch {
        return { ok: false };
      }

      if (!data.token || !data.user) {
        return { ok: false };
      }

      localStorage.setItem(STORAGE_TOKEN, data.token);
      setToken(data.token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));
      setUser(data.user);

      return { ok: true };
    } catch {
      return { ok: false };
    } finally {
      setStatus("idle");
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      signIn,
      signOut,
    }),
    [user, token, status, signIn, signOut]
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
