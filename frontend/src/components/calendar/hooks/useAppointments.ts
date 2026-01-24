import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Appointment,
  AppointmentWithDetails,
  Client,
  Service,
} from "@/types";

type CreateAppointmentInput = {
  clientId: string;
  serviceId: string;
  startUtc: string;
  endUtc: string;
  status: "confirmed" | "hold" | "cancelled";
  notes?: string;
};

type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export function useAppointments(from: Date, to: Date) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use stable timestamps for dependency tracking
  const fromTime = from.getTime();
  const toTime = to.getTime();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        from: new Date(fromTime).toISOString(),
        to: new Date(toTime).toISOString(),
      });

      const response = await fetch(`/api/appointments?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = (await response.json()) as {
        data: AppointmentWithDetails[];
      };
      setAppointments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fromTime, toTime]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = useCallback(
    async (input: CreateAppointmentInput): Promise<Appointment | null> => {
      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create appointment");
        }

        const data = (await response.json()) as { data: Appointment };
        await fetchAppointments();
        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [fetchAppointments]
  );

  const updateAppointment = useCallback(
    async (
      id: string,
      input: UpdateAppointmentInput
    ): Promise<Appointment | null> => {
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update appointment");
        }

        const data = (await response.json()) as { data: Appointment };
        await fetchAppointments();
        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [fetchAppointments]
  );

  const deleteAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to delete appointment");
        }

        await fetchAppointments();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      }
    },
    [fetchAppointments]
  );

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/services", {
        credentials: "include",
      });
      if (response.ok) {
        const data = (await response.json()) as { data: Service[] };
        setServices(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = useCallback(
    async (input: {
      name: string;
      durationMinutes: number;
      priceCents?: number;
    }): Promise<Service | null> => {
      try {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { data: Service };
        setServices((prev) => [...prev, data.data]);
        return data.data;
      } catch {
        return null;
      }
    },
    []
  );

  const updateService = useCallback(
    async (
      id: string,
      input: { name?: string; durationMinutes?: number; priceCents?: number }
    ): Promise<Service | null> => {
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { data: Service };
        setServices((prev) =>
          prev.map((s) => (s.id === id ? data.data : s))
        );
        return data.data;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { services, loading, createService, updateService, deleteService, refetch: fetchServices };
}

export function useClients(searchQuery: string = "") {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const response = await fetch(`/api/clients${params}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = (await response.json()) as { data: Client[] };
        setClients(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(searchQuery);
  }, [searchQuery, fetchClients]);

  const createClient = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      notes?: string;
    }): Promise<Client | null> => {
      try {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { data: Client };
        setClients((prev) => [...prev, data.data]);
        return data.data;
      } catch {
        return null;
      }
    },
    []
  );

  const updateClient = useCallback(
    async (
      id: string,
      input: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        notes?: string;
      }
    ): Promise<Client | null> => {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { data: Client };
        setClients((prev) =>
          prev.map((c) => (c.id === id ? data.data : c))
        );
        return data.data;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.error || "Failed to delete client" };
      }

      setClients((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch {
      return { success: false, error: "Failed to delete client" };
    }
  }, []);

  return { clients, loading, createClient, updateClient, deleteClient, refetch: () => fetchClients(searchQuery) };
}
