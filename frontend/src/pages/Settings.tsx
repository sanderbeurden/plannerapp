import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSettings, type Language } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";

const START_HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 12];
const END_HOUR_OPTIONS = [17, 18, 19, 20, 21, 22, 23];

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();

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
        </div>
      </main>
    </div>
  );
}
