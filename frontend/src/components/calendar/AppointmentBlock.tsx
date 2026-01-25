import { cn } from "@/lib/utils";
import type { AppointmentWithDetails } from "@/types";
import { formatTime, getDurationMinutes, formatDuration } from "./hooks/useDateUtils";

type AppointmentBlockProps = {
  appointment: AppointmentWithDetails;
  startHour: number;
  hourHeight: number;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isDragging?: boolean;
};

export function AppointmentBlock({
  appointment,
  startHour,
  hourHeight,
  onClick,
  onDragStart,
  isDragging,
}: AppointmentBlockProps) {
  const start = new Date(appointment.startUtc);
  const end = new Date(appointment.endUtc);

  const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
  const durationMinutes = getDurationMinutes(start, end);

  const top = (startMinutes / 60) * hourHeight;
  const height = (durationMinutes / 60) * hourHeight;

  const statusClass = {
    confirmed: "status-confirmed",
    hold: "status-hold",
    cancelled: "status-cancelled",
  }[appointment.status];

  const minHeightForDetails = 50;
  const showDetails = height >= minHeightForDetails;

  return (
    <div
      className={cn(
        "absolute left-1 right-2 cursor-pointer overflow-hidden rounded-xl pointer-events-auto",
        "border-l-4 bg-[var(--status-bg)] shadow-sm",
        "transition-all duration-150 hover:shadow-md hover:-translate-y-0.5",
        "animate-appointment-appear",
        statusClass,
        isDragging && "opacity-50",
        appointment.status === "cancelled" && "opacity-60"
      )}
      style={{
        top,
        height: Math.max(height, 24),
        borderLeftColor: "var(--status-color)",
      }}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex h-full flex-col p-2">
        <div className="flex items-start justify-between gap-1">
          <span
            className={cn(
              "text-sm font-semibold text-foreground truncate",
              appointment.status === "cancelled" && "line-through"
            )}
          >
            {appointment.service.name}
          </span>
          {!showDetails && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTime(start)}
            </span>
          )}
        </div>

        {showDetails && (
          <>
            <span className="text-sm text-muted-foreground truncate">
              {appointment.client.fullName}
            </span>
            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(start)}</span>
              <span>{formatDuration(durationMinutes)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
