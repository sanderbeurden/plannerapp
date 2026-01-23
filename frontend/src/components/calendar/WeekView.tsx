import { cn } from "@/lib/utils";
import { useCalendar } from "./hooks/useCalendar";
import {
  getWeekDays,
  formatDayOfWeekShort,
  isSameDay,
  isToday,
} from "./hooks/useDateUtils";
import type { AppointmentWithDetails } from "@/types";

type WeekViewProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onDayClick: (date: Date) => void;
};

const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function WeekView({
  appointments,
  onAppointmentClick,
  onDayClick,
}: WeekViewProps) {
  const { selectedDate } = useCalendar();
  const weekDays = getWeekDays(selectedDate);

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.startUtc), date));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                {formatDayOfWeekShort(day)}
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
        {timeStr} · {appointment.client.name}
      </div>
    </button>
  );
}
