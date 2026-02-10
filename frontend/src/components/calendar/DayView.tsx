import { useCallback, useRef, useState, useEffect } from "react";
import { TimeGrid } from "./TimeGrid";
import { NowIndicator } from "./NowIndicator";
import { AppointmentBlock } from "./AppointmentBlock";
import { useCalendar } from "./hooks/useCalendar";
import { useSettings } from "@/lib/settings";
import type { AppointmentWithDetails } from "@/types";
import { isSameDay, setTimeOnDate } from "./hooks/useDateUtils";

type DayViewProps = {
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onReschedule: (appointmentId: string, newStart: Date, newEnd: Date) => void;
  scrollToMinutes?: number | null;
  onScrollTargetConsumed?: () => void;
};

const HOUR_HEIGHT = 112; // 28px per 15-min slot for better touch targets
const GRID_TOP_PADDING_PX = 12; // Matches TimeGrid pt-3

type DragPreview = {
  slotMinutes: number;
  top: number;
  height: number;
  start: Date;
  end: Date;
};

export function DayView({
  appointments,
  onAppointmentClick,
  onSlotClick,
  onReschedule,
  scrollToMinutes,
  onScrollTargetConsumed,
}: DayViewProps) {
  const { selectedDate, goToPrevious, goToNext } = useCalendar();
  const { settings } = useSettings();
  const START_HOUR = settings.calendarStartHour;
  const END_HOUR = settings.calendarEndHour;
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPointerOffsetMinutesRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const lastSelectedDateKeyRef = useRef<string | null>(null);
  const lastManualScrollKeyRef = useRef<string | null>(null);
  const lastAutoScrollKeyRef = useRef<string | null>(null);

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

  // Handle manual scroll (from WeekView click)
  // Use useEffect with setTimeout to ensure scroll happens after render is complete
  useEffect(() => {
    if (scrollToMinutes === null || scrollToMinutes === undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const dateKey = selectedDate.toDateString();

    const totalMinutes = (END_HOUR - START_HOUR) * 60;
    const clampedMinutes = Math.max(0, Math.min(scrollToMinutes, totalMinutes));
    const targetOffset = (clampedMinutes / 60) * HOUR_HEIGHT + GRID_TOP_PADDING_PX;
    const desiredScrollTop = targetOffset - container.clientHeight / 2;

    // Defer scroll to next frame to ensure layout is complete
    // Set the ref and call onScrollTargetConsumed INSIDE the timeout to survive StrictMode
    const timeoutId = setTimeout(() => {
      // Check again inside timeout in case something changed
      if (lastManualScrollKeyRef.current === dateKey) return;

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const finalScrollTop = Math.max(0, Math.min(desiredScrollTop, maxScrollTop));
      container.scrollTop = finalScrollTop;

      // Mark as scrolled AFTER successful scroll
      lastManualScrollKeyRef.current = dateKey;

      if (onScrollTargetConsumed) {
        onScrollTargetConsumed();
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, scrollToMinutes, onScrollTargetConsumed, START_HOUR, END_HOUR]);

  // Handle auto-scroll to "now" for today's date
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dateKey = selectedDate.toDateString();
    if (lastSelectedDateKeyRef.current !== dateKey) {
      lastSelectedDateKeyRef.current = dateKey;
      lastAutoScrollKeyRef.current = null;
    }

    // Skip auto-scroll if manual scroll was used
    if (lastManualScrollKeyRef.current === dateKey) return;

    if (!isSameDay(new Date(), selectedDate)) return;
    if (lastAutoScrollKeyRef.current === dateKey) return;

    const now = new Date();
    const minutesFromStart = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
    const totalMinutes = (END_HOUR - START_HOUR) * 60;
    const clampedMinutes = Math.max(0, Math.min(minutesFromStart, totalMinutes));
    const targetOffset = (clampedMinutes / 60) * HOUR_HEIGHT + GRID_TOP_PADDING_PX;
    const desiredScrollTop = targetOffset - container.clientHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    requestAnimationFrame(() => {
      container.scrollTop = Math.max(0, Math.min(desiredScrollTop, maxScrollTop));
    });
    lastAutoScrollKeyRef.current = dateKey;
  }, [selectedDate, START_HOUR, END_HOUR]);

  const clearDragState = useCallback(() => {
    setDraggingId(null);
    setDragPreview(null);
    dragPointerOffsetMinutesRef.current = 0;
  }, []);

  const getDurationMinutes = useCallback((appointment: AppointmentWithDetails) => {
    const start = new Date(appointment.startUtc);
    const end = new Date(appointment.endUtc);
    return Math.max(
      15,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    );
  }, []);

  const calculateDropPreview = useCallback(
    (clientY: number, durationMinutes: number): DragPreview | null => {
      const container = containerRef.current;
      if (!container) return null;

      const gridElement = container.querySelector<HTMLElement>("[data-time-grid-hours]");
      if (!gridElement) return null;

      const rect = gridElement.getBoundingClientRect();
      const pointerMinutes = ((clientY - rect.top) / HOUR_HEIGHT) * 60;

      let slotMinutes = Math.round(
        (pointerMinutes - dragPointerOffsetMinutesRef.current) / 15
      ) * 15;
      const dayMinutes = (END_HOUR - START_HOUR) * 60;
      const maxStartMinutes = Math.max(0, dayMinutes - durationMinutes);
      slotMinutes = Math.max(0, Math.min(slotMinutes, maxStartMinutes));

      const hour = START_HOUR + Math.floor(slotMinutes / 60);
      const minute = slotMinutes % 60;
      const start = setTimeOnDate(selectedDate, hour, minute);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      return {
        slotMinutes,
        top: (slotMinutes / 60) * HOUR_HEIGHT,
        height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 24),
        start,
        end,
      };
    },
    [selectedDate, START_HOUR, END_HOUR]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, appointment: AppointmentWithDetails) => {
      setDraggingId(appointment.id);
      const durationMinutes = getDurationMinutes(appointment);

      const blockElement = e.currentTarget as HTMLDivElement;
      const blockRect = blockElement.getBoundingClientRect();
      const pointerOffsetPx = Math.max(
        0,
        Math.min(e.clientY - blockRect.top, blockRect.height)
      );
      dragPointerOffsetMinutesRef.current = Math.max(
        0,
        Math.min((pointerOffsetPx / HOUR_HEIGHT) * 60, durationMinutes)
      );

      e.dataTransfer.setData("appointmentId", appointment.id);
      e.dataTransfer.effectAllowed = "move";

      // Use a custom drag image so the dragged item feels lifted and slightly compact.
      const dragImage = blockElement.cloneNode(true) as HTMLDivElement;
      dragImage.style.position = "fixed";
      dragImage.style.top = "-10000px";
      dragImage.style.left = "-10000px";
      dragImage.style.width = `${blockRect.width}px`;
      dragImage.style.pointerEvents = "none";
      dragImage.style.transform = "scale(0.96)";
      dragImage.style.opacity = "0.96";
      dragImage.style.boxShadow = "0 18px 36px rgba(15, 23, 42, 0.22)";
      document.body.appendChild(dragImage);

      e.dataTransfer.setDragImage(
        dragImage,
        Math.max(0, Math.min(e.clientX - blockRect.left, blockRect.width)),
        pointerOffsetPx
      );

      requestAnimationFrame(() => {
        dragImage.remove();
      });

      const nextPreview = calculateDropPreview(e.clientY, durationMinutes);
      setDragPreview(nextPreview);
    },
    [calculateDropPreview, getDurationMinutes]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      const appointmentId = e.dataTransfer.getData("appointmentId") || draggingId;
      if (!appointmentId) return;

      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) return;

      const durationMinutes = getDurationMinutes(appointment);
      const nextPreview = calculateDropPreview(e.clientY, durationMinutes);
      if (!nextPreview) return;

      setDragPreview((prev) => {
        if (
          prev &&
          prev.slotMinutes === nextPreview.slotMinutes &&
          prev.height === nextPreview.height
        ) {
          return prev;
        }
        return nextPreview;
      });
    },
    [appointments, draggingId, calculateDropPreview, getDurationMinutes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const appointmentId = e.dataTransfer.getData("appointmentId") || draggingId;
      if (!appointmentId) {
        clearDragState();
        return;
      }

      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) {
        clearDragState();
        return;
      }

      const durationMinutes = getDurationMinutes(appointment);
      const placement = calculateDropPreview(e.clientY, durationMinutes) ?? dragPreview;
      if (!placement) {
        clearDragState();
        return;
      }

      const oldStart = new Date(appointment.startUtc);
      const oldEnd = new Date(appointment.endUtc);
      if (
        oldStart.getTime() !== placement.start.getTime() ||
        oldEnd.getTime() !== placement.end.getTime()
      ) {
        onReschedule(appointmentId, placement.start, placement.end);
      }

      clearDragState();
    },
    [
      appointments,
      draggingId,
      dragPreview,
      clearDragState,
      calculateDropPreview,
      getDurationMinutes,
      onReschedule,
    ]
  );

  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto scrollbar-hidden rounded-none md:rounded-xl border-y md:border border-border/40 md:border-border bg-card h-[calc(100dvh-180px)] md:h-[calc(100vh-280px)]"
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
          className="absolute top-3 bottom-0 pointer-events-none"
          style={{ left: 64, right: 0 }}
        >
          <NowIndicator
            selectedDate={selectedDate}
            startHour={START_HOUR}
            endHour={END_HOUR}
            hourHeight={HOUR_HEIGHT}
          />

          {dragPreview && (
            <div
              className="absolute left-0.5 right-1 md:left-1 md:right-2 rounded-lg md:rounded-xl border border-dashed border-primary/40 bg-primary/12 ring-1 ring-primary/15 shadow-[0_8px_24px_rgba(15,23,42,0.12)] pointer-events-none transition-[top,height] duration-75"
              style={{
                top: dragPreview.top,
                height: dragPreview.height,
              }}
              aria-hidden
            />
          )}

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
