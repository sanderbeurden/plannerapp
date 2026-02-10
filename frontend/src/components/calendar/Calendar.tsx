import { useCallback, useState } from "react";
import { ArrowRight, CalendarClock, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AppointmentWithDetails, AppointmentStatus, RecurrencePattern } from "@/types";

type PendingReschedule = {
  appointment: AppointmentWithDetails;
  appointmentId: string;
  oldStart: Date;
  oldEnd: Date;
  newStart: Date;
  newEnd: Date;
};

export function Calendar() {
  const { t, language } = useTranslation();
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
  const [pendingReschedule, setPendingReschedule] =
    useState<PendingReschedule | null>(null);
  const [isRescheduleSaving, setIsRescheduleSaving] = useState(false);
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
    (appointmentId: string, newStart: Date, newEnd: Date) => {
      const appointment = appointments.find((item) => item.id === appointmentId);
      if (!appointment) return;

      const oldStart = new Date(appointment.startUtc);
      const oldEnd = new Date(appointment.endUtc);
      if (
        oldStart.getTime() === newStart.getTime() &&
        oldEnd.getTime() === newEnd.getTime()
      ) {
        return;
      }

      setPendingReschedule({
        appointment,
        appointmentId,
        oldStart,
        oldEnd,
        newStart,
        newEnd,
      });
    },
    [appointments]
  );

  const formatMoveRange = useCallback((start: Date, end: Date) => {
    const locale = language === "nl" ? "nl-NL" : "en-US";
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    const isSameDate = start.toDateString() === end.toDateString();

    if (isSameDate) {
      return `${dateFormatter.format(start)} - ${timeFormatter.format(end)}`;
    }
    return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
  }, [language]);

  const handleCancelReschedule = useCallback(() => {
    if (isRescheduleSaving) return;
    setPendingReschedule(null);
  }, [isRescheduleSaving]);

  const handleConfirmReschedule = useCallback(async () => {
    if (!pendingReschedule) return;

    setIsRescheduleSaving(true);
    try {
      await updateAppointment(pendingReschedule.appointmentId, {
        startUtc: pendingReschedule.newStart.toISOString(),
        endUtc: pendingReschedule.newEnd.toISOString(),
      });
      setPendingReschedule(null);
    } catch (err) {
      console.error("Failed to reschedule appointment:", err);
    } finally {
      setIsRescheduleSaving(false);
    }
  }, [pendingReschedule, updateAppointment]);

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

      <Dialog
        open={!!pendingReschedule}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelReschedule();
          }
        }}
      >
        <DialogContent className="p-0 md:max-w-md">
          <div className="relative overflow-hidden rounded-t-2xl px-5 pb-4 pt-5 md:px-6 md:pt-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/15 to-transparent" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base">{t("appointment.moveConfirmTitle")}</DialogTitle>
                <DialogDescription>{t("appointment.moveConfirmDescription")}</DialogDescription>
              </div>
            </div>

            {pendingReschedule && (
              <div className="relative mt-4 rounded-xl border border-border/70 bg-background/80 p-3">
                <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {pendingReschedule.appointment.service.name} · {pendingReschedule.appointment.client.fullName}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/80 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">{t("appointment.moveFrom")}</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatMoveRange(pendingReschedule.oldStart, pendingReschedule.oldEnd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                    <span className="text-xs font-medium text-primary">{t("appointment.moveTo")}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatMoveRange(pendingReschedule.newStart, pendingReschedule.newEnd)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelReschedule}
                disabled={isRescheduleSaving}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={!pendingReschedule || isRescheduleSaving}
              >
                <ArrowRight className="h-4 w-4" />
                {isRescheduleSaving ? t("appointment.saving") : t("appointment.moveConfirmAction")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
