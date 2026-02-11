import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { apiUrl } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "error";

export function VerifyEmail() {
  const { t } = useTranslation();
  const location = useLocation();
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token") ?? "";
    if (!token) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    fetch(apiUrl("/api/auth/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("invalid");
        }
        if (!cancelled) {
          setStatus("success");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.search]);

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
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft text-center space-y-4">
          <h1 className="text-2xl font-semibold">{t("auth.verifyTitle")}</h1>
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          )}
          {status === "success" && (
            <p className="text-sm text-emerald-700">{t("auth.verifySuccess")}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-700">{t("auth.verifyFailed")}</p>
          )}
          <Button asChild className="w-full">
            <Link to="/login">{t("auth.signIn")}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
