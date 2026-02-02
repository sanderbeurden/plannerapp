import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useCalendar } from "./hooks/useCalendar";
import {
  getWeekDays,
  formatDayOfWeekShortLocalized,
  isSameDay,
  isToday,
} from "./hooks/useDateUtils";

export function DateStrip() {
  const { selectedDate, setSelectedDate } = useCalendar();
  const { dayNamesShort } = useTranslation();
  const weekDays = getWeekDays(selectedDate);

  return (
    <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="flex justify-between px-1 py-1.5">
        {weekDays.map((day, i) => {
          const dayIsToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={i}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 active:opacity-70"
              onClick={() => setSelectedDate(day)}
            >
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                {formatDayOfWeekShortLocalized(day, dayNamesShort)}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  dayIsToday && "bg-primary text-primary-foreground",
                  isSelected && !dayIsToday && "ring-2 ring-primary text-foreground"
                )}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
