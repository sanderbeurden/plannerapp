import { useEffect, useRef, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails, Client, Service, AppointmentStatus } from "@/types";
import { formatTime } from "./hooks/useDateUtils";
import { useServices, useClients } from "./hooks/useAppointments";

type AppointmentModalProps = {
  mode: "create" | "edit";
  appointment?: AppointmentWithDetails | null;
  defaultTimeSlot?: { start: Date; end: Date } | null;
  onClose: () => void;
  onSave: (data: {
    clientId: string;
    serviceId: string;
    startUtc: string;
    endUtc: string;
    status: AppointmentStatus;
    notes?: string;
  }) => Promise<boolean>;
};

export function AppointmentModal({
  mode,
  appointment,
  defaultTimeSlot,
  onClose,
  onSave,
}: AppointmentModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { services, loading: loadingServices } = useServices();
  const [clientSearch, setClientSearch] = useState("");
  const { clients, loading: loadingClients } = useClients(clientSearch);

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    appointment?.client ?? null
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    appointment?.service ?? null
  );
  const [startDate, setStartDate] = useState(() => {
    if (appointment) return new Date(appointment.startUtc);
    if (defaultTimeSlot) return defaultTimeSlot.start;
    return new Date();
  });
  const [startTime, setStartTime] = useState(() => {
    const d = appointment
      ? new Date(appointment.startUtc)
      : defaultTimeSlot?.start ?? new Date();
    // Round minutes to nearest 15-minute interval, clamping to 23:45 max
    let minutes = Math.round(d.getMinutes() / 15) * 15;
    let hours = d.getHours() + Math.floor(minutes / 60);
    minutes = minutes % 60;
    // Clamp to 23:45 to prevent day rollover
    if (hours >= 24) {
      hours = 23;
      minutes = 45;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  });
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? "confirmed"
  );
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single dropdown state - only one can be open at a time
  const [openDropdown, setOpenDropdown] = useState<"client" | "service" | "time" | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClient) {
      setError("Please select a client");
      return;
    }
    if (!selectedService) {
      setError("Please select a service");
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const start = new Date(startDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + selectedService.durationMinutes * 60 * 1000);

    setSaving(true);
    try {
      const success = await onSave({
        clientId: selectedClient.id,
        serviceId: selectedService.id,
        startUtc: start.toISOString(),
        endUtc: end.toISOString(),
        status,
        notes: notes || undefined,
      });

      if (success) {
        onClose();
      } else {
        setError("Failed to save appointment. There may be a scheduling conflict.");
      }
    } catch (err) {
      console.error("Failed to save appointment:", err);
      setError("Failed to save appointment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const endTime = selectedService
    ? (() => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const end = new Date(startDate);
        end.setHours(hours, minutes + selectedService.durationMinutes, 0, 0);
        return formatTime(end);
      })()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        ref={ref}
        className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card shadow-soft animate-appointment-appear"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "New Appointment" : "Edit Appointment"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Client</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center rounded-lg border border-input bg-background px-3 py-2 cursor-pointer",
                  openDropdown === "client" && "ring-2 ring-ring"
                )}
                onClick={() => setOpenDropdown(openDropdown === "client" ? null : "client")}
              >
                {selectedClient ? (
                  <span>{selectedClient.fullName}</span>
                ) : (
                  <span className="text-muted-foreground">Select a client...</span>
                )}
              </div>

              {openDropdown === "client" && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 px-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="flex-1 bg-transparent text-sm outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-auto p-1">
                    {loadingClients ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setSelectedClient(client);
                              setOpenDropdown(null);
                              setClientSearch("");
                            }}
                          >
                            {client.fullName}
                          </button>
                        ))}
                        {clients.length === 0 && !clientSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No clients yet. Add clients in Settings → Clients.
                          </div>
                        )}
                        {clients.length === 0 && clientSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No matching clients
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 cursor-pointer",
                  openDropdown === "service" && "ring-2 ring-ring"
                )}
                onClick={() => setOpenDropdown(openDropdown === "service" ? null : "service")}
              >
                {selectedService ? (
                  <div className="flex items-center justify-between w-full">
                    <span>{selectedService.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedService.durationMinutes} min
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select a service...</span>
                )}
              </div>

              {openDropdown === "service" && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 px-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="flex-1 bg-transparent text-sm outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-auto p-1">
                    {loadingServices ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {filteredServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setSelectedService(service);
                              setOpenDropdown(null);
                              setServiceSearch("");
                            }}
                          >
                            <span>{service.name}</span>
                            <span className="text-muted-foreground">
                              {service.durationMinutes} min
                            </span>
                          </button>
                        ))}
                        {filteredServices.length === 0 && !serviceSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No services yet. Add services in Settings → Services.
                          </div>
                        )}
                        {filteredServices.length === 0 && serviceSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No matching services
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={`${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split("-").map(Number);
                  const newDate = new Date(startDate);
                  newDate.setFullYear(year, month - 1, day);
                  setStartDate(newDate);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <TimeSelect
                value={startTime}
                onChange={setStartTime}
                isOpen={openDropdown === "time"}
                onToggle={() => setOpenDropdown(openDropdown === "time" ? null : "time")}
              />
            </div>
          </div>

          {selectedService && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Ends at: </span>
              <span className="font-medium">{endTime}</span>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2">
              {(["confirmed", "hold"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    status === s
                      ? s === "confirmed"
                        ? "border-status-confirmed bg-status-confirmed-bg text-status-confirmed"
                        : "border-status-hold bg-status-hold-bg text-status-hold"
                      : "border-border hover:bg-muted"
                  )}
                  onClick={() => setStatus(s)}
                >
                  {s === "confirmed" ? "Confirmed" : "Hold"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Add any notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Appointment" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TimeSelect({
  value,
  onChange,
  isOpen,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const timeSlots = Array.from({ length: (23 - 8 + 1) * 4 }, (_, i) => {
    const hour = 8 + Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-left text-sm outline-none",
          isOpen && "ring-2 ring-ring"
        )}
      >
        {value}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => {
                onChange(slot);
                onToggle();
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                slot === value && "bg-primary/10 font-medium"
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
