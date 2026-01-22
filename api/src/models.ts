export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AppBindings = {
  Variables: {
    user: AuthUser;
  };
};

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

const VALID_STATUSES: readonly AppointmentStatus[] = ["confirmed", "hold", "cancelled"];

export function isValidAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as AppointmentStatus);
}

function parseAppointmentStatus(value: string): AppointmentStatus {
  if (isValidAppointmentStatus(value)) {
    return value;
  }
  throw new Error(`Invalid appointment status: ${value}`);
}

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

type DbClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

type DbServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number | null;
  created_at: string;
};

type DbAppointmentRow = {
  id: string;
  client_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export function mapClient(row: DbClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapService(row: DbServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    createdAt: row.created_at,
  };
}

export function mapAppointment(row: DbAppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    startUtc: row.start_time,
    endUtc: row.end_time,
    status: parseAppointmentStatus(row.status),
    notes: row.notes,
    createdAt: row.created_at,
  };
}
