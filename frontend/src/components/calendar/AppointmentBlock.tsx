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
  compact?: boolean;
};

export function AppointmentBlock({
  appointment,
  startHour,
  hourHeight,
  onClick,
  onDragStart,
  isDragging,
  compact,
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
  const timeRange = `${formatTime(start)} - ${formatTime(end)}`;

  return (
    <div
      className={cn(
        "absolute left-0.5 right-1 md:left-1 md:right-2 cursor-pointer overflow-hidden rounded-lg md:rounded-xl pointer-events-auto",
        "border-l-[3px] md:border-l-4 bg-[var(--status-bg)]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-all duration-150",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98] active:opacity-90",
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
      <div className={cn("flex h-full flex-col", compact ? "p-1 md:p-1.5" : "p-1.5 md:p-2")}>
        <div className="flex items-start justify-between gap-1">
          <span
            className={cn(
              "font-semibold text-foreground truncate leading-tight",
              compact ? "text-[11px]" : "text-xs md:text-sm",
              appointment.status === "cancelled" && "line-through"
            )}
          >
            {appointment.service.name}
          </span>
          {!showDetails && (
            <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
              {timeRange}
            </span>
          )}
        </div>

        {showDetails && (
          <>
            <span className={cn("text-muted-foreground truncate leading-tight", compact ? "text-[10px]" : "text-xs md:text-sm")}>
              {appointment.client.fullName}
            </span>
            <div className={cn("mt-auto flex items-center justify-between text-muted-foreground", compact ? "text-[9px]" : "text-[11px] md:text-xs")}>
              <span>{timeRange}</span>
              <span>{formatDuration(durationMinutes)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
