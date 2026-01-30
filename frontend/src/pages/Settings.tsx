import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, type Language } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

const START_HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const END_HOUR_OPTIONS = [17, 18, 19, 20, 21, 22, 23];

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [exportMessage, setExportMessage] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async (endpoint: string, filename: string) => {
    setExportMessage("");
    try {
      const response = await fetch(apiUrl(endpoint), { credentials: "include" });
      if (!response.ok) {
        setExportMessage(t("settings.exportFailed"));
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setExportMessage(t("settings.exportFailed"));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMessage("");
    if (!deletePassword.trim()) {
      setDeleteMessage(t("settings.deletePasswordRequired"));
      return;
    }

    const confirmed = window.confirm(t("settings.deleteConfirm"));
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(apiUrl("/api/account/delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { code?: string };
        const errorKey =
          data.code === "AUTH_INVALID_CREDENTIALS"
            ? "settings.deletePasswordInvalid"
            : data.code === "AUTH_PASSWORD_TOO_LONG"
              ? "auth.passwordTooLong"
              : data.code === "RATE_LIMIT"
                ? "auth.rateLimited"
                : "settings.deleteFailed";
        setDeleteMessage(t(errorKey));
        setDeleting(false);
        return;
      }

      await signOut();
      navigate("/", { replace: true });
    } catch {
      setDeleteMessage(t("settings.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 py-4">
          <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("common.settings")}
            </p>
            <h1 className="text-lg font-semibold">{t("settings.preferences")}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="space-y-6">
          {/* Language Section */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium mb-4">{t("settings.language")}</h2>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as Language })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="en">{t("settings.english")}</option>
              <option value="nl">{t("settings.dutch")}</option>
            </select>
          </div>

          {/* Calendar Hours Section */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium mb-4">{t("settings.calendarHours")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">{t("settings.startHour")}</label>
                <select
                  value={settings.calendarStartHour}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value);
                    updateSettings({
                      calendarStartHour: newStart,
                      // Ensure end hour is always after start hour
                      calendarEndHour: Math.max(settings.calendarEndHour, newStart + 1)
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {START_HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("settings.endHour")}</label>
                <select
                  value={settings.calendarEndHour}
                  onChange={(e) => updateSettings({ calendarEndHour: parseInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {END_HOUR_OPTIONS.filter((hour) => hour > settings.calendarStartHour).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Export Section */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h2 className="text-sm font-medium">{t("settings.exportTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.exportHelp")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  handleExport(
                    "/api/exports/clients",
                    `clients-${new Date().toISOString().slice(0, 10)}.csv`
                  )
                }
              >
                <Download className="h-4 w-4" />
                {t("settings.exportClients")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleExport(
                    "/api/exports/appointments",
                    `appointments-${new Date().toISOString().slice(0, 10)}.csv`
                  )
                }
              >
                <Download className="h-4 w-4" />
                {t("settings.exportAppointments")}
              </Button>
            </div>
          {exportMessage && (
            <p className="text-sm text-red-600">{exportMessage}</p>
          )}
          </div>

          {/* Delete Account */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <h2 className="text-sm font-medium text-red-700">{t("settings.deleteAccountTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.deleteAccountHelp")}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {t("auth.password")}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? `${t("common.delete")}...` : t("settings.deleteAccount")}
              </Button>
              {deleteMessage && (
                <p className="text-sm text-red-600">{deleteMessage}</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
