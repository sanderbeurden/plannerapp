import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCalendar } from "./hooks/useCalendar";
import {
  getMonthGrid,
  addDays,
  isSameDay,
  isToday,
  startOfMonth,
} from "./hooks/useDateUtils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function MiniCalendar() {
  const { selectedDate, setSelectedDate, setView } = useCalendar();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));

  const monthGrid = getMonthGrid(viewMonth);

  const goToPrevMonth = () => {
    setViewMonth((current) => {
      const prev = new Date(current);
      prev.setMonth(prev.getMonth() - 1);
      return prev;
    });
  };

  const goToNextMonth = () => {
    setViewMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setView("day");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {monthGrid.flat().map((date, i) => {
          if (!date) {
            return <div key={i} />;
          }

          const dayIsToday = isToday(date);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(date)}
              className={cn(
                "h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors",
                "hover:bg-muted",
                dayIsToday && !isSelected && "text-primary font-semibold",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setViewMonth(startOfMonth(new Date()));
          }}
          className="w-full text-sm text-primary hover:underline"
        >
          Go to Today
        </button>
      </div>
    </div>
  );
}
