import { createContext, useContext, useMemo } from "react";
import { useSettings, type Language } from "../settings";
import { en, type TranslationKeys } from "./en";
import { nl } from "./nl";

const translations: Record<Language, TranslationKeys> = {
  en,
  nl,
};

type I18nContextValue = {
  language: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  dayNames: string[];
  dayNamesShort: string[];
  monthNames: string[];
  monthNamesShort: string[];
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const language = settings.language;

  const value = useMemo(() => {
    const currentTranslations = translations[language];

    const t = (key: string, params?: Record<string, string | number>): string => {
      let text = getNestedValue(currentTranslations, key);
      if (!text) {
        // Fallback to English
        text = getNestedValue(en, key);
      }
      if (!text) {
        return key;
      }
      if (params) {
        for (const [param, value] of Object.entries(params)) {
          text = text.replace(`{${param}}`, String(value));
        }
      }
      return text;
    };

    const days = currentTranslations.days;
    const months = currentTranslations.months;

    return {
      language,
      t,
      dayNames: [
        days.sunday,
        days.monday,
        days.tuesday,
        days.wednesday,
        days.thursday,
        days.friday,
        days.saturday,
      ],
      dayNamesShort: [
        days.sunShort,
        days.monShort,
        days.tueShort,
        days.wedShort,
        days.thuShort,
        days.friShort,
        days.satShort,
      ],
      monthNames: [
        months.january,
        months.february,
        months.march,
        months.april,
        months.may,
        months.june,
        months.july,
        months.august,
        months.september,
        months.october,
        months.november,
        months.december,
      ],
      monthNamesShort: [
        months.janShort,
        months.febShort,
        months.marShort,
        months.aprShort,
        months.mayShort,
        months.junShort,
        months.julShort,
        months.augShort,
        months.sepShort,
        months.octShort,
        months.novShort,
        months.decShort,
      ],
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
