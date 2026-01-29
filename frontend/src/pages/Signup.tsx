import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";

type Status = "idle" | "loading" | "error";

export function Signup() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useTranslation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signUp(name, email, password);
      if (!result.ok) {
        setStatus("error");
        setMessage(
          result.errorCode === "AUTH_EMAIL_EXISTS"
            ? t("auth.emailExists")
            : t("auth.signUpError")
        );
        return;
      }

      form.reset();
      setStatus("idle");
      navigate("/app", { replace: true });
    } catch {
      setStatus("error");
      setMessage(t("auth.signUpError"));
    }
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
            <h1 className="text-3xl font-semibold">{t("auth.createAccount")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.getStarted")}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              {t("auth.name")}
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="text"
                  name="name"
                  placeholder="Alex Carter"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              {t("auth.email")}
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="email"
                  name="email"
                  placeholder="owner@salon.com"
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
              {status === "loading" ? `${t("auth.signUp")}...` : t("auth.signUp")}
            </Button>
          </form>

          {message && status === "error" ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-foreground">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
