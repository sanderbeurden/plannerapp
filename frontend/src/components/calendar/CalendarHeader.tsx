import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "./hooks/useCalendar";
import { formatDate, formatDayOfWeek, isToday } from "./hooks/useDateUtils";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/types";

export function CalendarHeader() {
  const {
    selectedDate,
    view,
    setView,
    goToToday,
    goToPrevious,
    goToNext,
    openCreateModal,
  } = useCalendar();

  const todayLabel = isToday(selectedDate) ? "Today" : formatDayOfWeek(selectedDate);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="hidden sm:inline-flex"
        >
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <h2 className="text-xl font-semibold">{formatDate(selectedDate)}</h2>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="sm:hidden"
        >
          Today
        </Button>
        <ViewSwitcher view={view} onViewChange={setView} />
        <Button onClick={() => openCreateModal()} className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" />
          New
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
        Day
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
        Week
      </button>
    </div>
  );
}
