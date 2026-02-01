import { useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { NowIndicator } from "./NowIndicator";
import { AppointmentBlock } from "./AppointmentBlock";
import { useCalendar } from "./hooks/useCalendar";
import { useSettings } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import type { AppointmentWithDetails } from "@/types";
import {
  getWeekDays,
  isSameDay,
  isToday,
  addDays,
  setTimeOnDate,
  formatDayOfWeekShortLocalized,
  formatTimeShort,
} from "./hooks/useDateUtils";

type MobileWeekGridProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onReschedule: (appointmentId: string, newStart: Date, newEnd: Date) => void;
};

const HOUR_HEIGHT = 60;
const GRID_TOP_PADDING_PX = 12;

export function MobileWeekGrid({
  appointments,
  onAppointmentClick,
  onSlotClick,
  onReschedule,
}: MobileWeekGridProps) {
  const { selectedDate, setSelectedDate } = useCalendar();
  const { settings } = useSettings();
  const { dayNamesShort } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const lastAutoScrollKeyRef = useRef<string | null>(null);

  const START_HOUR = settings.calendarStartHour;
  const END_HOUR = settings.calendarEndHour;
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );
  const slotHeight = HOUR_HEIGHT / 4;

  const weekDays = getWeekDays(selectedDate);

  // Touch swipe navigation — navigate by 7 days
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      const threshold = 80;
      if (Math.abs(diff) > threshold) {
        setSelectedDate(addDays(selectedDate, diff > 0 ? -7 : 7));
      }
      touchStartX.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [selectedDate, setSelectedDate]);

  // Auto-scroll to "now" on load
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dateKey = selectedDate.toDateString();
    if (lastAutoScrollKeyRef.current === dateKey) return;

    const showsToday = weekDays.some((d) => isToday(d));
    if (!showsToday) {
      lastAutoScrollKeyRef.current = dateKey;
      return;
    }

    const now = new Date();
    const minutesFromStart =
      (now.getHours() - START_HOUR) * 60 + now.getMinutes();
    const totalMinutes = (END_HOUR - START_HOUR) * 60;
    const clampedMinutes = Math.max(0, Math.min(minutesFromStart, totalMinutes));
    const targetOffset =
      (clampedMinutes / 60) * HOUR_HEIGHT + GRID_TOP_PADDING_PX;
    const desiredScrollTop = targetOffset - container.clientHeight / 2;
    const maxScrollTop = Math.max(
      0,
      container.scrollHeight - container.clientHeight
    );

    requestAnimationFrame(() => {
      container.scrollTop = Math.max(
        0,
        Math.min(desiredScrollTop, maxScrollTop)
      );
    });
    lastAutoScrollKeyRef.current = dateKey;
  }, [selectedDate, START_HOUR, END_HOUR, weekDays]);

  const handleSlotClick = useCallback(
    (day: Date, hour: number, quarterIndex: number) => {
      const minute = quarterIndex * 15;
      const start = setTimeOnDate(day, hour, minute);
      const end = setTimeOnDate(day, hour, minute + 30);
      onSlotClick(start, end);
    },
    [onSlotClick]
  );

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.startUtc), date));

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[2rem_repeat(7,1fr)] border-b border-border/60">
        <div /> {/* Spacer for time labels */}
        {weekDays.map((day, i) => {
          const dayIsToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center py-1.5",
                i < 6 && "border-r border-border/40"
              )}
            >
              <span className="text-[9px] uppercase text-muted-foreground font-medium">
                {formatDayOfWeekShortLocalized(day, dayNamesShort)}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  dayIsToday && "bg-primary text-primary-foreground",
                  isSelected && !dayIsToday && "ring-1 ring-primary"
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: "calc(100dvh - 160px)" }}
      >
        <div className="relative flex pt-3">
          {/* Time labels column */}
          <div className="relative w-8 flex-shrink-0 border-r border-border/60">
            {hours.map((hour) => {
              const date = new Date();
              date.setHours(hour, 0, 0, 0);
              return (
                <div
                  key={hour}
                  className="relative"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="absolute -top-2 right-1 text-[9px] text-muted-foreground">
                    {formatTimeShort(date)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                "relative flex-1 min-w-0",
                dayIndex < 6 && "border-r border-border/30"
              )}
            >
              {/* Hour rows with 15-min slots */}
              {hours.map((hour, hourIndex) => (
                <div
                  key={hour}
                  className="relative border-b border-border/30"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {hourIndex % 2 === 0 && (
                    <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
                  )}

                  {[0, 1, 2, 3].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSlotClick(day, hour, q)}
                      className="absolute left-0 right-0 cursor-pointer active:bg-primary/10 transition-colors"
                      style={{ top: q * slotHeight, height: slotHeight }}
                    />
                  ))}

                  {/* Half-hour line */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-border/40 pointer-events-none"
                    style={{ top: HOUR_HEIGHT * 0.5 }}
                  />
                </div>
              ))}

              {/* Appointments layer */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: GRID_TOP_PADDING_PX }}
              >
                <NowIndicator
                  selectedDate={day}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  hourHeight={HOUR_HEIGHT}
                />

                {getAppointmentsForDay(day).map((appointment) => (
                  <AppointmentBlock
                    key={appointment.id}
                    appointment={appointment}
                    startHour={START_HOUR}
                    hourHeight={HOUR_HEIGHT}
                    onClick={() => onAppointmentClick(appointment)}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
