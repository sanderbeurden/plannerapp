import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CalendarView, AppointmentWithDetails } from "@/types";
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from "./useDateUtils";

export type CalendarState = {
  selectedDate: Date;
  view: CalendarView;
  modalOpen: boolean;
  modalMode: "create" | "edit";
  selectedAppointment: AppointmentWithDetails | null;
  selectedTimeSlot: { start: Date; end: Date } | null;
};

export type CalendarActions = {
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  openCreateModal: (timeSlot?: { start: Date; end: Date }) => void;
  openEditModal: (appointment: AppointmentWithDetails) => void;
  closeModal: () => void;
  getDateRange: () => { from: Date; to: Date };
};

export type CalendarContextValue = CalendarState & CalendarActions;

export const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarState(): CalendarContextValue {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    setSelectedDate((current) => {
      if (view === "day") {
        return addDays(current, -1);
      }
      return addDays(current, -7);
    });
  }, [view]);

  const goToNext = useCallback(() => {
    setSelectedDate((current) => {
      if (view === "day") {
        return addDays(current, 1);
      }
      return addDays(current, 7);
    });
  }, [view]);

  const openCreateModal = useCallback(
    (timeSlot?: { start: Date; end: Date }) => {
      setModalMode("create");
      setSelectedAppointment(null);
      setSelectedTimeSlot(timeSlot ?? null);
      setModalOpen(true);
    },
    []
  );

  const openEditModal = useCallback((appointment: AppointmentWithDetails) => {
    setModalMode("edit");
    setSelectedAppointment(appointment);
    setSelectedTimeSlot(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setSelectedTimeSlot(null);
  }, []);

  const getDateRange = useCallback(() => {
    if (view === "day") {
      return {
        from: startOfDay(selectedDate),
        to: endOfDay(selectedDate),
      };
    }
    return {
      from: startOfWeek(selectedDate),
      to: endOfWeek(selectedDate),
    };
  }, [view, selectedDate]);

  return useMemo(
    () => ({
      selectedDate,
      view,
      modalOpen,
      modalMode,
      selectedAppointment,
      selectedTimeSlot,
      setSelectedDate,
      setView,
      goToToday,
      goToPrevious,
      goToNext,
      openCreateModal,
      openEditModal,
      closeModal,
      getDateRange,
    }),
    [
      selectedDate,
      view,
      modalOpen,
      modalMode,
      selectedAppointment,
      selectedTimeSlot,
      goToToday,
      goToPrevious,
      goToNext,
      openCreateModal,
      openEditModal,
      closeModal,
      getDateRange,
    ]
  );
}

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within CalendarProvider");
  }
  return context;
}
