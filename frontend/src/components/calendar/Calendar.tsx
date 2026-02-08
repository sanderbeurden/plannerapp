import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { CalendarContext, useCalendarState } from "./hooks/useCalendar";
import { useAppointments } from "./hooks/useAppointments";
import { CalendarHeader } from "./CalendarHeader";
import { DateStrip } from "./DateStrip";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MiniCalendar } from "./MiniCalendar";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentPopover } from "./AppointmentPopover";
import { useTranslation } from "@/lib/i18n";
import type { AppointmentWithDetails, AppointmentStatus, RecurrencePattern } from "@/types";

export function Calendar() {
  const { t } = useTranslation();
  const calendarState = useCalendarState();
  const { from, to } = calendarState.getDateRange();
  const {
    appointments,
    loading,
    createAppointment,
    previewRecurrence,
    updateAppointment,
    deleteAppointment,
  } = useAppointments(from, to);

  const [popoverAppointment, setPopoverAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [scrollTargetMinutes, setScrollTargetMinutes] = useState<number | null>(null);
  const handleScrollTargetConsumed = useCallback(() => {
    setScrollTargetMinutes(null);
  }, []);

  const handleAppointmentClick = useCallback(
    (appointment: AppointmentWithDetails) => {
      setPopoverAppointment(appointment);
    },
    []
  );

  const handleSlotClick = useCallback(
    (start: Date, end: Date) => {
      calendarState.openCreateModal({ start, end });
    },
    [calendarState]
  );

  const handleReschedule = useCallback(
    async (appointmentId: string, newStart: Date, newEnd: Date) => {
      try {
        await updateAppointment(appointmentId, {
          startUtc: newStart.toISOString(),
          endUtc: newEnd.toISOString(),
        });
      } catch (err) {
        console.error("Failed to reschedule appointment:", err);
      }
    },
    [updateAppointment]
  );

  const handleSaveAppointment = useCallback(
    async (data: {
      clientId: string;
      serviceId: string;
      startUtc: string;
      endUtc: string;
      status: AppointmentStatus;
      notes?: string;
      recurrence?: { pattern: RecurrencePattern; count: number };
      excludeDates?: string[];
    }) => {
      if (calendarState.modalMode === "create") {
        const result = await createAppointment(data);
        return result !== null;
      } else if (calendarState.selectedAppointment) {
        const result = await updateAppointment(
          calendarState.selectedAppointment.id,
          { ...data, scope: calendarState.editScope }
        );
        return result !== null;
      }
      return false;
    },
    [
      calendarState.modalMode,
      calendarState.selectedAppointment,
      calendarState.editScope,
      createAppointment,
      updateAppointment,
    ]
  );

  const handlePreviewRecurrence = useCallback(
    async (data: {
      clientId: string;
      serviceId: string;
      startUtc: string;
      endUtc: string;
      status: AppointmentStatus;
      notes?: string;
      recurrence: { pattern: RecurrencePattern; count: number };
    }) => {
      return previewRecurrence(data);
    },
    [previewRecurrence]
  );

  const handleStatusChange = useCallback(
    async (status: AppointmentStatus) => {
      if (popoverAppointment) {
        try {
          await updateAppointment(popoverAppointment.id, { status });
        } catch (err) {
          console.error("Failed to update appointment status:", err);
        } finally {
          setPopoverAppointment(null);
        }
      }
    },
    [popoverAppointment, updateAppointment]
  );

  const handleDeleteAppointment = useCallback(async (scope?: "single" | "future") => {
    if (popoverAppointment) {
      await deleteAppointment(popoverAppointment.id, scope);
      setPopoverAppointment(null);
    }
  }, [popoverAppointment, deleteAppointment]);

  return (
    <CalendarContext.Provider value={calendarState}>
      <div className="flex gap-6">
        {/* Mini calendar sidebar - hidden on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <MiniCalendar />
        </div>

        {/* Main calendar area */}
        <div className="flex-1 min-w-0 space-y-3 md:space-y-4">
          <CalendarHeader />
          {calendarState.view === "day" && <DateStrip />}

          {loading ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">
                  {t("calendar.loadingAppointments")}
                </span>
              </div>
            </div>
          ) : calendarState.view === "day" ? (
            <DayView
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
              onReschedule={handleReschedule}
              scrollToMinutes={scrollTargetMinutes}
              onScrollTargetConsumed={handleScrollTargetConsumed}
            />
          ) : (
            <WeekView
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onSlotClick={handleSlotClick}
              onReschedule={handleReschedule}
              onDayClick={(date, scrollToMinutes) => {
                calendarState.setSelectedDate(date);
                calendarState.setView("day");
                setScrollTargetMinutes(
                  scrollToMinutes !== undefined ? scrollToMinutes : null
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {calendarState.modalOpen && (
        <AppointmentModal
          mode={calendarState.modalMode}
          appointment={calendarState.selectedAppointment}
          defaultTimeSlot={calendarState.selectedTimeSlot}
          existingAppointments={appointments}
          onClose={calendarState.closeModal}
          onSave={handleSaveAppointment}
          onPreviewRecurrence={handlePreviewRecurrence}
        />
      )}

      {popoverAppointment && (
        <AppointmentPopover
          appointment={popoverAppointment}
          onClose={() => setPopoverAppointment(null)}
          onEdit={(scope) => {
            calendarState.openEditModal(popoverAppointment, scope);
            setPopoverAppointment(null);
          }}
          onDelete={handleDeleteAppointment}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => calendarState.openCreateModal()}
        className="group fixed bottom-6 right-5 sm:hidden z-40"
      >
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full
          bg-primary text-primary-foreground
          shadow-[0_6px_20px_rgba(0,0,0,0.25),inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-2px_4px_rgba(0,0,0,0.1)]
          group-active:scale-[0.92] group-active:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_3px_rgba(0,0,0,0.15)]
          transition-all duration-150 active:duration-75"
        >
          <Plus className="relative h-6 w-6 drop-shadow-sm
            group-active:rotate-90 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" />
        </span>
      </button>
    </CalendarContext.Provider>
  );
}
