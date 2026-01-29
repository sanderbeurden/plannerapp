import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

type Status = "idle" | "loading" | "error";

export function Login() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { t } = useTranslation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn(email, password);
    if (!result.ok) {
      setStatus("error");
      const errorKey =
        result.errorCode === "RATE_LIMIT"
          ? "auth.rateLimited"
          : "auth.invalidCredentials";
      setMessage(t(errorKey));
      return;
    }

    form.reset();
    setStatus("idle");
    const from =
      (location.state as { from?: { pathname?: string } })?.from?.pathname ??
      "/app";
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.tagline")}
            </p>
            <p className="text-lg font-semibold text-foreground">{t("landing.title")}</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/">{t("common.back")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">{t("auth.welcomeBack")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.signInToContinue")}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              {t("auth.email")}
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="email"
                  name="email"
                  placeholder="you@salon.com"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              {t("auth.password")}
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </label>
            <Button className="w-full" size="lg" disabled={status === "loading"}>
              {status === "loading" ? `${t("auth.signIn")}...` : t("auth.signIn")}
            </Button>
          </form>

          {message && status === "error" ? (
            <p
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" className="font-semibold text-foreground">
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
