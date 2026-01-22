export type Client = {
  id: string;
  name: string;
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

export type Appointment = {
  id: string;
  clientId: string;
  serviceId: string;
  startUtc: string;
  endUtc: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
};

export type AppointmentWithDetails = Appointment & {
  client: Client;
  service: Service;
};

export type CalendarView = "day" | "week";
