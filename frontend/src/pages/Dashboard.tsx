import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, Scissors, Users, Sliders } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/calendar";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative z-40 border-b border-border/40 bg-card/60 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl md:rounded-2xl bg-primary text-primary-foreground">
              <img
                src="/icons/logo.svg"
                alt={`${t("landing.title")} logo`}
                className="h-4 w-4 md:h-5 md:w-5"
              />
            </div>
            <div>
              <p className="hidden md:block text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t("landing.tagline")}
              </p>
              <p className="text-base md:text-lg font-semibold text-foreground leading-tight">{t("landing.title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden text-sm text-muted-foreground md:block mr-2">
              {user?.name ?? "Owner"}
            </div>
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn("h-9 w-9", showSettings && "bg-muted")}
              >
                <Settings className="h-[18px] w-[18px]" />
              </Button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/60 bg-card shadow-lg z-50 animate-appointment-appear">
                  <div className="p-1.5">
                    <Link
                      to="/app/services"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm active:bg-muted/80 hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      {t("services.title")}
                    </Link>
                    <Link
                      to="/app/clients"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm active:bg-muted/80 hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {t("clients.title")}
                    </Link>
                    <Link
                      to="/app/settings"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm active:bg-muted/80 hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Sliders className="h-4 w-4 text-muted-foreground" />
                      {t("common.settings")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-3 pb-24 md:px-6 md:pt-6 md:pb-6">
        <Calendar />
      </main>
    </div>
  );
}
