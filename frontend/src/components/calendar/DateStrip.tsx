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
    <div className="md:hidden sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-border/30">
      <div className="flex justify-between px-2 py-2">
        {weekDays.map((day, i) => {
          const dayIsToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={i}
              className="flex flex-col items-center gap-1 flex-1 py-1 active:opacity-60 transition-opacity"
              onClick={() => setSelectedDate(day)}
            >
              <span className={cn(
                "text-[11px] uppercase font-medium tracking-wide transition-colors",
                isSelected || dayIsToday ? "text-primary" : "text-muted-foreground"
              )}>
                {formatDayOfWeekShortLocalized(day, dayNamesShort)}
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-200",
                  dayIsToday && "bg-primary text-primary-foreground",
                  isSelected && !dayIsToday && "bg-foreground text-background",
                  !isSelected && !dayIsToday && "text-foreground"
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
