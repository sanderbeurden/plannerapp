import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { useCalendar } from "./hooks/useCalendar";
import {
  getWeekDays,
  formatDayOfWeekShortLocalized,
  getDurationMinutes,
  isSameDay,
  isToday,
} from "./hooks/useDateUtils";
import type { AppointmentWithDetails } from "@/types";

type WeekViewProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onDayClick: (date: Date, scrollToMinutes?: number) => void;
};

export function WeekView({
  appointments,
  onAppointmentClick,
  onDayClick,
}: WeekViewProps) {
  const { selectedDate } = useCalendar();
  const { settings } = useSettings();
  const { dayNamesShort } = useTranslation();
  const weekDays = getWeekDays(selectedDate);

  const MOBILE_START_HOUR = settings.calendarStartHour;
  const MOBILE_END_HOUR = settings.calendarEndHour;
  const MOBILE_HOURS = Array.from(
    { length: MOBILE_END_HOUR - MOBILE_START_HOUR },
    (_, i) => MOBILE_START_HOUR + i
  );

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.startUtc), date));

  const handleAppointmentTap = (apt: AppointmentWithDetails, e: React.MouseEvent) => {
    e.stopPropagation();
    const start = new Date(apt.startUtc);
    const minutesFromStart = Math.max(
      0,
      (start.getHours() - MOBILE_START_HOUR) * 60 + start.getMinutes()
    );
    onDayClick(new Date(apt.startUtc), minutesFromStart);
  };

  const getAppointmentPosition = (apt: AppointmentWithDetails) => {
    const start = new Date(apt.startUtc);
    const end = new Date(apt.endUtc);
    const startMinutes = (start.getHours() - MOBILE_START_HOUR) * 60 + start.getMinutes();
    const duration = getDurationMinutes(start, end);
    const totalMinutes = (MOBILE_END_HOUR - MOBILE_START_HOUR) * 60;
    
    const topPercent = Math.max(0, (startMinutes / totalMinutes) * 100);
    const heightPercent = Math.max(2, (duration / totalMinutes) * 100);
    
    return { topPercent, heightPercent, isVisible: startMinutes + duration > 0 && startMinutes < totalMinutes };
  };

  const getClickMinutes = (yOffset: number, height: number) => {
    const totalMinutes = (MOBILE_END_HOUR - MOBILE_START_HOUR) * 60;
    const ratio = height > 0 ? yOffset / height : 0;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const rawMinutes = clampedRatio * totalMinutes;
    return Math.round(rawMinutes / 15) * 15;
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Mobile: Week grid with hours */}
      <div className="md:hidden">
        {/* Header: Day names and dates */}
        <div className="grid grid-cols-[2rem_1fr] border-b border-border/60">
          <div /> {/* Spacer for hour column */}
          <div className="grid grid-cols-7">
            {weekDays.map((day, i) => {
              const dayIsToday = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={i}
                  className={cn(
                    "flex flex-col items-center py-2 active:bg-muted/50",
                    i < 6 && "border-r border-border/40",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onDayClick(day)}
                >
                  <span className="text-[9px] uppercase text-muted-foreground">
                    {formatDayOfWeekShortLocalized(day, dayNamesShort)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      dayIsToday && "bg-primary text-primary-foreground",
                      isSelected && !dayIsToday && "ring-1 ring-primary"
                    )}
                  >
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[2rem_1fr]">
          {/* Hour labels */}
          <div className="relative">
            {MOBILE_HOURS.map((hour, i) => (
              <div
                key={hour}
                className={cn(
                  "h-8 flex items-start justify-end pr-1 text-[10px] text-muted-foreground",
                  i > 0 && "border-t border-border/30"
                )}
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Day columns with appointments */}
          <div className="grid grid-cols-7 relative">
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "relative",
                    dayIndex < 6 && "border-r border-border/30",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const yOffset = e.clientY - rect.top;
                    onDayClick(day, getClickMinutes(yOffset, rect.height));
                  }}
                >
                  {/* Hour grid lines */}
                  {MOBILE_HOURS.map((hour, i) => (
                    <div
                      key={hour}
                      className={cn(
                        "h-8",
                        i > 0 && "border-t border-border/30"
                      )}
                    />
                  ))}

                  {/* Appointments overlay */}
                  <div className="absolute inset-0">
                    {dayAppointments.map((apt) => {
                      const { topPercent, heightPercent, isVisible } = getAppointmentPosition(apt);
                      if (!isVisible) return null;
                      
                      return (
                        <button
                          key={apt.id}
                          onClick={(e) => handleAppointmentTap(apt, e)}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded-sm active:opacity-80",
                            apt.status === "confirmed" && "bg-status-confirmed",
                            apt.status === "hold" && "bg-status-hold",
                            apt.status === "cancelled" && "bg-status-cancelled opacity-50"
                          )}
                          style={{
                            top: `${topPercent}%`,
                            height: `${Math.max(heightPercent, 3)}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
      {/* Header row with day names */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day, i) => {
          const dayIsToday = isToday(day);
          return (
            <button
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 py-3 hover:bg-muted/50 transition-colors",
                i < 6 && "border-r border-border"
              )}
              onClick={() => onDayClick(day)}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {formatDayOfWeekShortLocalized(day, dayNamesShort)}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  dayIsToday && "bg-primary text-primary-foreground",
                  isSameDay(day, selectedDate) &&
                    !dayIsToday &&
                    "ring-2 ring-primary"
                )}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body with appointments */}
      <div className="grid grid-cols-7" style={{ minHeight: 400 }}>
        {weekDays.map((day, i) => {
          const dayAppointments = getAppointmentsForDay(day);
          return (
            <div
              key={i}
              className={cn(
                "relative p-2 space-y-1 cursor-pointer hover:bg-muted/30 transition-colors",
                i < 6 && "border-r border-border"
              )}
              onClick={() => onDayClick(day)}
            >
              {dayAppointments.slice(0, 5).map((apt) => (
                <WeekAppointmentPill
                  key={apt.id}
                  appointment={apt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentClick(apt);
                  }}
                />
              ))}
              {dayAppointments.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{dayAppointments.length - 5} more
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function WeekAppointmentPill({
  appointment,
  onClick,
}: {
  appointment: AppointmentWithDetails;
  onClick: (e: React.MouseEvent) => void;
}) {
  const start = new Date(appointment.startUtc);
  const hours = start.getHours();
  const minutes = start.getMinutes();
  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  const statusClass = {
    confirmed: "status-confirmed",
    hold: "status-hold",
    cancelled: "status-cancelled",
  }[appointment.status];

  return (
    <button
      className={cn(
        "w-full text-left rounded-lg px-2 py-1.5 text-xs transition-all",
        "bg-[var(--status-bg)] border-l-2 hover:shadow-sm",
        statusClass,
        appointment.status === "cancelled" && "opacity-60"
      )}
      style={{ borderLeftColor: "var(--status-color)" }}
      onClick={onClick}
    >
      <div className="font-medium truncate">{appointment.service.name}</div>
      <div className="text-muted-foreground truncate">
        {timeStr} · {appointment.client.fullName}
      </div>
    </button>
  );
}
