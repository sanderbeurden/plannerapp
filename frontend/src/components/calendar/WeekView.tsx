import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useCalendar } from "./hooks/useCalendar";
import { MobileWeekGrid } from "./MobileWeekGrid";
import {
  getWeekDays,
  formatDayOfWeekShortLocalized,
  isSameDay,
  isToday,
} from "./hooks/useDateUtils";
import type { AppointmentWithDetails } from "@/types";

type WeekViewProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onDayClick: (date: Date, scrollToMinutes?: number) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onReschedule: (appointmentId: string, newStart: Date, newEnd: Date) => void;
};

export function WeekView({
  appointments,
  onAppointmentClick,
  onDayClick,
  onSlotClick,
  onReschedule,
}: WeekViewProps) {
  const { selectedDate } = useCalendar();
  const { dayNamesShort } = useTranslation();
  const weekDays = getWeekDays(selectedDate);

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.startUtc), date));

  return (
    <div>
      {/* Mobile: Three-day time view */}
      <div className="md:hidden">
        <MobileWeekGrid
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
          onSlotClick={onSlotClick}
          onDayClick={onDayClick}
          onReschedule={onReschedule}
        />
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden">
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
