import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { apiUrl } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export function ResetPasswordRequest() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");

    try {
      const response = await fetch(apiUrl("/api/auth/password-reset/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { code?: string };
        const errorKey =
          data.code === "RATE_LIMIT"
            ? "auth.rateLimited"
            : data.code === "AUTH_EMAIL_SEND_FAILED"
              ? "auth.emailSendFailed"
            : "auth.signUpError";
        setStatus("error");
        setMessage(t(errorKey));
        return;
      }

      setStatus("success");
      setMessage(t("auth.passwordResetRequestSent"));
      form.reset();
    } catch {
      setStatus("error");
      setMessage(t("auth.signUpError"));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <img
                src="/icons/logo.svg"
                alt={`${t("landing.title")} logo`}
                className="h-5 w-5"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t("landing.tagline")}
              </p>
              <p className="text-lg font-semibold text-foreground">{t("landing.title")}</p>
            </div>
          </div>
          <Button asChild variant="ghost">
            <Link to="/">{t("common.back")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">{t("auth.passwordResetRequestTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.passwordResetRequestHelp")}
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
            <Button className="w-full" size="lg" disabled={status === "loading"}>
              {status === "loading" ? `${t("auth.passwordResetRequestSubmit")}...` : t("auth.passwordResetRequestSubmit")}
            </Button>
          </form>

          {message && status === "error" ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </p>
          ) : null}
          {message && status === "success" ? (
            <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-foreground">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
