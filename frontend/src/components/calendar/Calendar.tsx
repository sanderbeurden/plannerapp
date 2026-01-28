import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { CalendarContext, useCalendarState } from "./hooks/useCalendar";
import { useAppointments } from "./hooks/useAppointments";
import { CalendarHeader } from "./CalendarHeader";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MiniCalendar } from "./MiniCalendar";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentPopover } from "./AppointmentPopover";
import { Button } from "@/components/ui/button";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types";

export function Calendar() {
  const calendarState = useCalendarState();
  const { from, to } = calendarState.getDateRange();
  const {
    appointments,
    loading,
    createAppointment,
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
    }) => {
      if (calendarState.modalMode === "create") {
        const result = await createAppointment(data);
        return result !== null;
      } else if (calendarState.selectedAppointment) {
        const result = await updateAppointment(
          calendarState.selectedAppointment.id,
          data
        );
        return result !== null;
      }
      return false;
    },
    [
      calendarState.modalMode,
      calendarState.selectedAppointment,
      createAppointment,
      updateAppointment,
    ]
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

  const handleDeleteAppointment = useCallback(async () => {
    if (popoverAppointment) {
      const confirmed = window.confirm(
        `Are you sure you want to delete this appointment for ${popoverAppointment.client.fullName}?`
      );
      if (confirmed) {
        await deleteAppointment(popoverAppointment.id);
        setPopoverAppointment(null);
      }
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
        <div className="flex-1 min-w-0 space-y-4">
          <CalendarHeader />

          {loading ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">
                  Loading appointments...
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
              onDayClick={(date, scrollToMinutes) => {
                console.log('[Calendar] onDayClick - date:', date.toDateString(), 'scrollToMinutes:', scrollToMinutes);
                calendarState.setSelectedDate(date);
                calendarState.setView("day");
                setScrollTargetMinutes(
                  scrollToMinutes !== undefined ? scrollToMinutes : null
                );
                console.log('[Calendar] setScrollTargetMinutes called with:', scrollToMinutes !== undefined ? scrollToMinutes : null);
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
        />
      )}

      {popoverAppointment && (
        <AppointmentPopover
          appointment={popoverAppointment}
          onClose={() => setPopoverAppointment(null)}
          onEdit={() => {
            calendarState.openEditModal(popoverAppointment);
            setPopoverAppointment(null);
          }}
          onDelete={handleDeleteAppointment}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Mobile FAB */}
      <Button
        onClick={() => calendarState.openCreateModal()}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </CalendarContext.Provider>
  );
}
