import { useMemo } from "react";

// Default English arrays for fallback
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Localized formatting functions that accept translated arrays
export function formatDateLocalized(
  date: Date,
  monthNames: string[]
): string {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateShortLocalized(
  date: Date,
  monthNamesShort: string[]
): string {
  return `${monthNamesShort[date.getMonth()]} ${date.getDate()}`;
}

export function formatDayOfWeekLocalized(
  date: Date,
  dayNames: string[]
): string {
  return dayNames[date.getDay()];
}

export function formatDayOfWeekShortLocalized(
  date: Date,
  dayNamesShort: string[]
): string {
  return dayNamesShort[date.getDay()];
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function formatTimeShort(date: Date): string {
  const hours = date.getHours();
  return `${hours.toString().padStart(2, "0")}:00`;
}

export function formatDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateShort(date: Date): string {
  return `${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export function formatDayOfWeek(date: Date): string {
  return FULL_DAY_NAMES[date.getDay()];
}

export function formatDayOfWeekShort(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getMonthGrid(date: Date): (Date | null)[][] {
  const firstDay = startOfMonth(date);
  const lastDay = endOfMonth(date);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Pad the first week
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(date.getFullYear(), date.getMonth(), day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function getDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

export function setTimeOnDate(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function roundToNearestMinutes(date: Date, interval: number): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const rounded = Math.round(minutes / interval) * interval;
  result.setMinutes(rounded, 0, 0);
  return result;
}

export function floorToNearestMinutes(date: Date, interval: number): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const floored = Math.floor(minutes / interval) * interval;
  result.setMinutes(floored, 0, 0);
  return result;
}

export function useDateUtils() {
  return useMemo(
    () => ({
      formatTime,
      formatTimeShort,
      formatDate,
      formatDateShort,
      formatDayOfWeek,
      formatDayOfWeekShort,
      formatDateLocalized,
      formatDateShortLocalized,
      formatDayOfWeekLocalized,
      formatDayOfWeekShortLocalized,
      isSameDay,
      isToday,
      addDays,
      startOfDay,
      endOfDay,
      startOfWeek,
      endOfWeek,
      getWeekDays,
      startOfMonth,
      endOfMonth,
      getMonthGrid,
      getDurationMinutes,
      formatDuration,
      setTimeOnDate,
      roundToNearestMinutes,
      floorToNearestMinutes,
    }),
    []
  );
}
