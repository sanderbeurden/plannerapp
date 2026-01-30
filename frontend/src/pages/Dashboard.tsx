import { useState, useRef, useEffect } from "react";
import { LogOut, Settings, Scissors, Sparkles, Users, Sliders } from "lucide-react";
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
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t("landing.tagline")}
              </p>
              <p className="text-lg font-semibold text-foreground">{t("landing.title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden text-sm text-muted-foreground md:block mr-2">
              {user?.name ?? "Owner"}
            </div>
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={cn(showSettings && "bg-muted")}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
                  <div className="p-1">
                    <Link
                      to="/app/services"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Scissors className="h-4 w-4" />
                      {t("services.title")}
                    </Link>
                    <Link
                      to="/app/clients"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Users className="h-4 w-4" />
                      {t("clients.title")}
                    </Link>
                    <Link
                      to="/app/settings"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowSettings(false)}
                    >
                      <Sliders className="h-4 w-4" />
                      {t("common.settings")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pt-6 pb-24 md:pb-6">
        <Calendar />
      </main>
    </div>
  );
}
