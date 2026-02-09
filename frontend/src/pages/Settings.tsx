import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, type Language } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { useConnections } from "@/lib/connections";
import type { ConnectionPlatform } from "@/types";

const START_HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const END_HOUR_OPTIONS = [17, 18, 19, 20, 21, 22, 23];
const CONNECTIONS = [
  { platform: "instagram", Icon: Instagram },
  { platform: "facebook", Icon: Facebook },
  { platform: "whatsapp", Icon: MessageCircle },
] as const;

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [exportMessage, setExportMessage] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const {
    connections,
    loading: connectionsLoading,
    error: connectionError,
    actionPlatform,
    connect,
    disconnect,
  } = useConnections();

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

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

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

  const handleConnectionAction = async (
    platform: ConnectionPlatform,
    isCurrentlyConnected: boolean
  ) => {
    setConnectionMessage("");
    const success = isCurrentlyConnected
      ? await disconnect(platform)
      : await connect(platform);
    if (!success) {
      setConnectionMessage(t("settings.connectionFailed"));
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

          {/* Connections Section */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h2 className="text-sm font-medium">{t("settings.connectionsTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("settings.connectionsHelp")}
              </p>
            </div>

            {connectionsLoading ? (
              <p className="text-sm text-muted-foreground">{t("settings.connectionLoading")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {CONNECTIONS.map(({ platform, Icon }) => {
                  const connection = connections.find((item) => item.platform === platform);
                  const isConnected = connection?.status === "connected";

                  return (
                    <div
                      key={platform}
                      className="flex h-full min-h-[210px] flex-col items-center justify-center rounded-lg border border-border bg-background/60 p-4 text-center"
                    >
                      <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
                        <Icon className="h-9 w-9" />
                      </div>
                      <p
                        className={`mt-4 text-sm font-semibold ${
                          isConnected ? "text-emerald-700" : "text-muted-foreground"
                        }`}
                      >
                        {isConnected
                          ? t("settings.connectionConnected")
                          : t("settings.connectionDisconnected")}
                      </p>
                      <div className="mt-5 w-full">
                        <Button
                          variant={isConnected ? "outline" : "default"}
                          size="sm"
                          className="w-full"
                          disabled={actionPlatform === platform}
                          onClick={() => handleConnectionAction(platform, isConnected)}
                        >
                          {isConnected ? t("settings.disconnect") : t("settings.connect")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(connectionMessage || connectionError) && (
              <p className="text-sm text-red-600">{connectionMessage || t("settings.connectionFailed")}</p>
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
            {showDeleteConfirm && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                <p className="text-sm font-medium text-red-700">{t("settings.deleteConfirm")}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                    {t("common.cancel")}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? `${t("common.delete")}...` : t("common.confirm")}
                  </Button>
                </div>
              </div>
            )}
            {!showDeleteConfirm && (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {t("settings.deleteAccount")}
                </Button>
                {deleteMessage && (
                  <p className="text-sm text-red-600">{deleteMessage}</p>
                )}
              </div>
            )}
            {deleteMessage && showDeleteConfirm && (
              <p className="text-sm text-red-600">{deleteMessage}</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
