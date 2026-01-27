import { useEffect, useRef, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { AppointmentWithDetails, Client, Service, AppointmentStatus } from "@/types";
import { useServices, useClients } from "./hooks/useAppointments";



type AppointmentModalProps = {
  mode: "create" | "edit";
  appointment?: AppointmentWithDetails | null;
  defaultTimeSlot?: { start: Date; end: Date } | null;
  existingAppointments?: AppointmentWithDetails[];
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
  existingAppointments = [],
  onClose,
  onSave,
}: AppointmentModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { services, loading: loadingServices } = useServices();
  const [clientSearch, setClientSearch] = useState("");
  const { clients, loading: loadingClients } = useClients(clientSearch);

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    appointment?.client ?? null
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    appointment?.service ?? null
  );
  // Custom duration for this appointment (defaults to service duration, adjustable in 5-min increments)
  const [customDuration, setCustomDuration] = useState<number>(() => {
    if (appointment) {
      // Calculate duration from existing appointment
      const start = new Date(appointment.startUtc);
      const end = new Date(appointment.endUtc);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
    // Default for new appointments (will be updated when service is selected)
    return 30;
  });
  const [startDateTime, setStartDateTime] = useState(() => {
    const d = appointment
      ? new Date(appointment.startUtc)
      : defaultTimeSlot?.start ?? new Date();
    // Round minutes to nearest 15-minute interval
    let minutes = Math.round(d.getMinutes() / 15) * 15;
    let hours = d.getHours() + Math.floor(minutes / 60);
    minutes = minutes % 60;
    // Clamp to 23:45 to prevent day rollover
    if (hours >= 24) {
      hours = 23;
      minutes = 45;
    }
    d.setHours(hours, minutes, 0, 0);
    return d;
  });
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment?.status ?? "confirmed"
  );
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single dropdown state - only one can be open at a time
  const [openDropdown, setOpenDropdown] = useState<"client" | "service" | null>(null);
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

    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + customDuration * 60 * 1000);

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

  const endDateTime = new Date(startDateTime.getTime() + customDuration * 60 * 1000);

  // Check for overlaps with existing appointments
  const checkOverlap = (time: Date) => {
    const currentAppointmentId = appointment?.id;
    return existingAppointments.some((apt) => {
      // Skip the current appointment when editing
      if (apt.id === currentAppointmentId) return false;
      // Skip cancelled appointments
      if (apt.status === "cancelled") return false;
      const aptStart = new Date(apt.startUtc);
      const aptEnd = new Date(apt.endUtc);
      return time >= aptStart && time < aptEnd;
    });
  };

  const startOverlaps = selectedService && checkOverlap(startDateTime);
  const endOverlaps = selectedService && checkOverlap(endDateTime);
  const hasOverlap = startOverlaps || endOverlaps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        ref={ref}
        className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card shadow-soft animate-appointment-appear"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? t("appointment.newAppointment") : t("appointment.editAppointment")}
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
            <label className="text-sm font-medium">{t("appointment.client")}</label>
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
                  <span className="text-muted-foreground">{t("appointment.selectClient")}...</span>
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
                        placeholder={t("clients.searchPlaceholder")}
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
            <label className="text-sm font-medium">{t("appointment.service")}</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center rounded-lg border border-input bg-background px-3 py-2 cursor-pointer",
                  openDropdown === "service" && "ring-2 ring-ring"
                )}
                onClick={() => setOpenDropdown(openDropdown === "service" ? null : "service")}
              >
                {selectedService ? (
                  <span>{selectedService.name}</span>
                ) : (
                  <span className="text-muted-foreground">{t("appointment.selectService")}...</span>
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
                        placeholder={`${t("services.title")}...`}
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
                              setCustomDuration(service.durationMinutes);
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

          {/* When - Mobile-first minimal design */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("appointment.time")}</label>
            
            {/* Single stacked layout - works great on mobile */}
            <div className="space-y-3">
              {/* Date */}
              <input
                type="date"
                value={`${startDateTime.getFullYear()}-${(startDateTime.getMonth() + 1).toString().padStart(2, "0")}-${startDateTime.getDate().toString().padStart(2, "0")}`}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split("-").map(Number);
                  const newDate = new Date(startDateTime);
                  newDate.setFullYear(year, month - 1, day);
                  if (!isNaN(newDate.getTime())) setStartDateTime(newDate);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Start Time - native time picker, great on mobile */}
              <div
                className={cn(
                  "grid gap-2",
                  selectedService ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                <div className="relative">
                  <label className="absolute -top-2 left-2 bg-background px-1 text-[10px] text-muted-foreground">
                    Start
                  </label>
                  <input
                    type="time"
                    value={`${startDateTime.getHours().toString().padStart(2, "0")}:${startDateTime.getMinutes().toString().padStart(2, "0")}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      const newTime = new Date(startDateTime);
                      newTime.setHours(hours, minutes, 0, 0);
                      if (!isNaN(newTime.getTime())) setStartDateTime(newTime);
                    }}
                    step="900"
                    className={cn(
                      "w-full rounded-lg border bg-background px-3 py-3 text-base text-center font-medium outline-none focus:ring-2 focus:ring-ring",
                      startOverlaps ? "border-red-300 bg-red-50" : "border-input"
                    )}
                  />
                </div>
                {selectedService && (
                  <div className="relative">
                    <label className="absolute -top-2 left-2 bg-background px-1 text-[10px] text-muted-foreground">
                      End
                    </label>
                    <input
                      type="time"
                      value={`${endDateTime.getHours().toString().padStart(2, "0")}:${endDateTime.getMinutes().toString().padStart(2, "0")}`}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":").map(Number);
                        const newEnd = new Date(startDateTime);
                        newEnd.setHours(hours, minutes, 0, 0);
                        const newDuration = Math.round(
                          (newEnd.getTime() - startDateTime.getTime()) / (1000 * 60)
                        );
                        // Only allow valid durations (minimum 15 min, same day)
                        if (newDuration >= 15) {
                          setCustomDuration(newDuration);
                        }
                        // If duration would be negative (past midnight) or too short, ignore
                        // The UI naturally prevents this since end time input is bounded by the day
                      }}
                      step="900"
                      className={cn(
                        "w-full rounded-lg border bg-background px-3 py-3 text-base text-center font-medium outline-none focus:ring-2 focus:ring-ring",
                        endOverlaps ? "border-red-300 bg-red-50" : "border-input"
                      )}
                    />
                  </div>
                )}
              </div>

              {selectedService && (
                <>
                  {/* Duration display + quick adjust */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">
                      Duration: <span className="font-medium text-foreground">{customDuration} min</span>
                      {customDuration !== selectedService.durationMinutes && (
                        <button
                          type="button"
                          onClick={() => setCustomDuration(selectedService.durationMinutes)}
                          className="ml-2 text-xs underline hover:text-foreground"
                        >
                          reset
                        </button>
                      )}
                    </span>
                    {hasOverlap && (
                      <span className="text-sm text-red-600 font-medium">
                        Overlaps
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("appointment.status")}</label>
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
                  {s === "confirmed" ? t("appointment.confirmed") : t("appointment.hold")}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("appointment.notes")} ({t("common.optional")})</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder={`${t("appointment.notes")}...`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? t("appointment.schedule") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
