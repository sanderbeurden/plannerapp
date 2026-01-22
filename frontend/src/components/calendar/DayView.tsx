import { useCallback, useRef, useState, useEffect } from "react";
import { TimeGrid } from "./TimeGrid";
import { NowIndicator } from "./NowIndicator";
import { AppointmentBlock } from "./AppointmentBlock";
import { useCalendar } from "./hooks/useCalendar";
import type { AppointmentWithDetails } from "@/types";
import { isSameDay, setTimeOnDate } from "./hooks/useDateUtils";

type DayViewProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onReschedule: (appointmentId: string, newStart: Date, newEnd: Date) => void;
};

const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_HEIGHT = 80;

export function DayView({
  appointments,
  onAppointmentClick,
  onSlotClick,
  onReschedule,
}: DayViewProps) {
  const { selectedDate, goToPrevious, goToNext } = useCalendar();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Touch swipe navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;
      const threshold = 80;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }

      touchStartX.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToPrevious, goToNext]);

  const dayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.startUtc), selectedDate)
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, appointment: AppointmentWithDetails) => {
      setDraggingId(appointment.id);
      e.dataTransfer.setData("appointmentId", appointment.id);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const appointmentId = e.dataTransfer.getData("appointmentId");
      if (!appointmentId || !containerRef.current) {
        setDraggingId(null);
        return;
      }

      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) {
        setDraggingId(null);
        return;
      }

      const gridElement = containerRef.current.querySelector(
        "[data-time-grid]"
      );
      if (!gridElement) {
        setDraggingId(null);
        return;
      }

      const rect = gridElement.getBoundingClientRect();
      const y = Math.max(0, e.clientY - rect.top);
      const totalMinutes = (y / HOUR_HEIGHT) * 60;
      let slotMinutes = Math.round(totalMinutes / 15) * 15;

      const oldStart = new Date(appointment.startUtc);
      const oldEnd = new Date(appointment.endUtc);
      const durationMinutes = (oldEnd.getTime() - oldStart.getTime()) / (1000 * 60);

      // Clamp to valid bounds
      const maxStartMinutes = (END_HOUR - START_HOUR) * 60 - durationMinutes;
      slotMinutes = Math.max(0, Math.min(slotMinutes, maxStartMinutes));

      const hour = START_HOUR + Math.floor(slotMinutes / 60);
      const minute = slotMinutes % 60;

      const newStart = setTimeOnDate(selectedDate, hour, minute);
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000);

      onReschedule(appointmentId, newStart, newEnd);
      setDraggingId(null);
    },
    [appointments, selectedDate, onReschedule]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto rounded-xl border border-border bg-card"
      style={{ height: `calc(100vh - 280px)` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div className="relative" data-time-grid>
        <TimeGrid
          startHour={START_HOUR}
          endHour={END_HOUR}
          hourHeight={HOUR_HEIGHT}
          selectedDate={selectedDate}
          onSlotClick={onSlotClick}
        />

        {/* Appointments layer - positioned over the grid area (after the time labels) */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: 64, right: 0 }}
        >
          <NowIndicator
            selectedDate={selectedDate}
            startHour={START_HOUR}
            endHour={END_HOUR}
            hourHeight={HOUR_HEIGHT}
          />

          {dayAppointments.map((appointment) => (
            <AppointmentBlock
              key={appointment.id}
              appointment={appointment}
              startHour={START_HOUR}
              hourHeight={HOUR_HEIGHT}
              onClick={() => onAppointmentClick(appointment)}
              onDragStart={(e) => handleDragStart(e, appointment)}
              isDragging={draggingId === appointment.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
