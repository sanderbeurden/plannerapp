import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useCalendar } from "./hooks/useCalendar";
import {
  endOfWeek,
  formatDateLocalized,
  formatDayOfWeekLocalized,
  isToday,
  startOfWeek,
} from "./hooks/useDateUtils";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function CalendarHeader() {
  const {
    selectedDate,
    view,
    setView,
    setSelectedDate,
    goToToday,
    goToPrevious,
    goToNext,
    openCreateModal,
  } = useCalendar();
  const { t, dayNames, monthNames } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const todayLabel = isToday(selectedDate) ? t("calendar.today") : formatDayOfWeekLocalized(selectedDate, dayNames);
  const weekRange = useMemo(() => {
    if (view !== "week") return null;
    return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
  }, [selectedDate, view]);

  const handleCalendarSelect = (date?: Date) => {
    if (!date) return;
    const nextDate = new Date(date);
    nextDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    setSelectedDate(nextDate);
    setPickerOpen(false);
  };

  return (
    <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="h-7 text-xs px-2 sm:h-9 sm:text-sm sm:px-3"
        >
          {t("calendar.today")}
        </Button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-xl font-semibold">{formatDateLocalized(selectedDate, monthNames)}</h2>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                  aria-label={view === "week" ? t("calendar.week") : t("appointment.date")}
                >
                  <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarSelect}
                  modifiers={
                    weekRange
                      ? {
                          selectedWeek: (date) =>
                            date >= weekRange.start && date <= weekRange.end,
                        }
                      : undefined
                  }
                  modifiersClassNames={
                    weekRange
                      ? {
                          selectedWeek: "bg-primary/10 text-foreground",
                        }
                      : undefined
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground">{todayLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ViewSwitcher view={view} onViewChange={setView} />
        <Button onClick={() => openCreateModal()} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          {t("calendar.newAppointment")}
        </Button>
      </div>
    </div>
  );
}

function ViewSwitcher({
  view,
  onViewChange,
}: {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-1">
      <button
        onClick={() => onViewChange("day")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "day"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("calendar.day")}
      </button>
      <button
        onClick={() => onViewChange("week")}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          view === "week"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {t("calendar.week")}
      </button>
    </div>
  );
}
