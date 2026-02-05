import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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

/** Mobile-only: "Februari 19" (no year). Desktop: full date. */
function formatDateMobile(date: Date, monthNames: string[]): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

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
    <div className="flex items-center justify-between">
      {/* Left: date navigation */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 px-1 py-1 rounded-xl active:bg-muted/50 transition-colors"
            >
              {/* Mobile: short date, Desktop: full date */}
              <h2 className="text-[17px] font-semibold tracking-tight md:hidden whitespace-nowrap">
                {formatDateMobile(selectedDate, monthNames)}
              </h2>
              <h2 className="hidden md:block text-xl font-semibold tracking-tight">
                {formatDateLocalized(selectedDate, monthNames)}
              </h2>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-9 w-9 flex-shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Desktop only: today + day label */}
        {!isToday(selectedDate) && (
          <button
            onClick={goToToday}
            className="hidden md:block text-sm font-medium text-primary active:opacity-70 transition-opacity ml-2"
          >
            {t("calendar.today")}
          </button>
        )}
        <p className="hidden md:block text-sm text-muted-foreground ml-2">{todayLabel}</p>
      </div>

      {/* Right: view toggle + actions */}
      <div className="flex items-center gap-2 md:gap-3">
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
  const isWeek = view === "week";

  return (
    <div className="relative flex rounded-[10px] md:rounded-2xl p-[2px] md:p-[3px] bg-muted/60 border border-border/30">
      {/* Sliding indicator */}
      <div
        className={cn(
          "absolute top-[2px] bottom-[2px] md:top-[3px] md:bottom-[3px] rounded-lg md:rounded-xl",
          "bg-card",
          "shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0.5px_1px_rgba(0,0,0,0.06)]",
          "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isWeek ? "left-[50%] right-[2px] md:right-[3px]" : "left-[2px] md:left-[3px] right-[50%]"
        )}
      />

      <button
        onClick={() => onViewChange("day")}
        className={cn(
          "relative z-10 flex-1 text-center rounded-lg md:rounded-xl px-3.5 md:px-6 py-1 md:py-1.5 text-[13px] md:text-sm font-medium transition-colors duration-300",
          view === "day"
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        {t("calendar.day")}
      </button>
      <button
        onClick={() => onViewChange("week")}
        className={cn(
          "relative z-10 flex-1 text-center rounded-lg md:rounded-xl px-3.5 md:px-6 py-1 md:py-1.5 text-[13px] md:text-sm font-medium transition-colors duration-300",
          view === "week"
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        {t("calendar.week")}
      </button>
    </div>
  );
}
