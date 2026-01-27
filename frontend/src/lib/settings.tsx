import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "nl";

export type Settings = {
  calendarStartHour: number;
  calendarEndHour: number;
  language: Language;
};

const DEFAULT_SETTINGS: Settings = {
  calendarStartHour: 8,
  calendarEndHour: 23,
  language: "en",
};

const STORAGE_KEY = "plannerapp-settings";

type SettingsContextValue = {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
      calendarStartHour: parsed.calendarStartHour ?? DEFAULT_SETTINGS.calendarStartHour,
      calendarEndHour: parsed.calendarEndHour ?? DEFAULT_SETTINGS.calendarEndHour,
      language: parsed.language ?? DEFAULT_SETTINGS.language,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
    }),
    [settings, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
