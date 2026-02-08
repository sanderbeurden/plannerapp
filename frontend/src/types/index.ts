export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
  createdAt: string;
};

export type AppointmentStatus = "confirmed" | "hold" | "cancelled";

export type RecurrencePattern = "weekly" | "biweekly" | "monthly";

export type RecurrenceRule = {
  pattern: RecurrencePattern;
  count: number;
};

export type Appointment = {
  id: string;
  clientId: string;
  serviceId: string;
  startUtc: string;
  endUtc: string;
  status: AppointmentStatus;
  notes: string | null;
  recurrenceGroupId: string | null;
  recurrenceRule: RecurrenceRule | null;
  createdAt: string;
};

export type AppointmentWithDetails = Appointment & {
  client: Client;
  service: Service;
};

export type CalendarView = "day" | "week";
