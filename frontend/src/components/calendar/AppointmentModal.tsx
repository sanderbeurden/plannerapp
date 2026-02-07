import { useState } from "react";
import { X, Search, Loader2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { AppointmentWithDetails, Client, Service, AppointmentStatus } from "@/types";
import { useServices, useClients } from "./hooks/useAppointments";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}



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
  const { t } = useTranslation();
  const { services, loading: loadingServices } = useServices();
  const [clientSearch, setClientSearch] = useState("");
  const { clients, loading: loadingClients, createClient } = useClients(clientSearch);

  // New client form state
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

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

  const handleCreateClient = async () => {
    if (!newClientFirstName.trim() || !newClientLastName.trim()) return;

    setCreatingClient(true);
    const newClient = await createClient({
      firstName: newClientFirstName.trim(),
      lastName: newClientLastName.trim(),
    });
    setCreatingClient(false);

    if (newClient) {
      setSelectedClient(newClient);
      setShowNewClientForm(false);
      setNewClientFirstName("");
      setNewClientLastName("");
      setOpenDropdown(null);
      setClientSearch("");
    }
  };

  const resetNewClientForm = () => {
    setShowNewClientForm(false);
    setNewClientFirstName("");
    setNewClientLastName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClient) {
      setError(t("appointment.errors.selectClient"));
      return;
    }
    if (!selectedService) {
      setError(t("appointment.errors.selectService"));
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
        setError(t("appointment.errors.saveConflict"));
      }
    } catch (err) {
      console.error("Failed to save appointment:", err);
      setError(t("appointment.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const endDateTime = new Date(startDateTime.getTime() + customDuration * 60 * 1000);

  // Check for overlaps with existing appointments (full interval)
  const hasOverlap = selectedService
    ? existingAppointments.some((apt) => {
      if (apt.id === appointment?.id) return false;
      if (apt.status === "cancelled") return false;
      const aptStart = new Date(apt.startUtc);
      const aptEnd = new Date(apt.endUtc);
      return startDateTime < aptEnd && endDateTime > aptStart;
    })
    : false;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-auto p-0 animate-appointment-appear">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3">
          <DialogTitle>
            {mode === "create" ? t("appointment.newAppointment") : t("appointment.editAppointment")}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("appointment.client")}</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center rounded-lg border border-input bg-background px-3 py-2.5 text-base cursor-pointer",
                  openDropdown === "client" && "ring-2 ring-ring"
                )}
                onClick={() => {
                  if (openDropdown === "client") {
                    setOpenDropdown(null);
                    resetNewClientForm();
                  } else {
                    setOpenDropdown("client");
                  }
                }}
              >
                {selectedClient ? (
                  <span>{selectedClient.fullName}</span>
                ) : (
                  <span className="text-muted-foreground">{t("appointment.selectClient")}...</span>
                )}
              </div>

              {openDropdown === "client" && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  {showNewClientForm ? (
                    // New client form
                    <div className="p-3 space-y-3">
                      <div className="text-sm font-medium">{t("clients.addNew")}</div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newClientFirstName}
                          onChange={(e) => setNewClientFirstName(capitalizeFirst(e.target.value))}
                          placeholder={t("clients.firstName")}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={newClientLastName}
                          onChange={(e) => setNewClientLastName(capitalizeFirst(e.target.value))}
                          placeholder={t("clients.lastName")}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetNewClientForm}
                          disabled={creatingClient}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateClient}
                          disabled={!newClientFirstName.trim() || !newClientLastName.trim() || creatingClient}
                        >
                          {creatingClient ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          {t("common.add")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Client search and list
                    <>
                      <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-2 px-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder={t("clients.searchPlaceholder")}
                            className="flex-1 bg-transparent text-base outline-none"
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
                            {clients.length === 0 && clientSearch && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                {t("clients.noClients")}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* Add new client button */}
                      <div className="border-t border-border p-1">
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary hover:bg-muted"
                          onClick={() => setShowNewClientForm(true)}
                        >
                          <Plus className="h-4 w-4" />
                          {t("clients.addNew")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("appointment.service")}</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center rounded-lg border border-input bg-background px-3 py-2.5 text-base cursor-pointer",
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
                        className="flex-1 bg-transparent text-base outline-none"
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
                              {service.durationMinutes} {t("services.minutes")}
                            </span>
                          </button>
                        ))}
                        {filteredServices.length === 0 && !serviceSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {t("services.noServicesInline")}
                          </div>
                        )}
                        {filteredServices.length === 0 && serviceSearch && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {t("services.noMatching")}
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
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("appointment.time")}</label>

            {/* Single stacked layout - works great on mobile */}
            <div className="space-y-3">
              {/* Date - wrapped in div to match client/service field width */}
              <div className="rounded-lg border border-input bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="date"
                  value={`${startDateTime.getFullYear()}-${(startDateTime.getMonth() + 1).toString().padStart(2, "0")}-${startDateTime.getDate().toString().padStart(2, "0")}`}
                  onChange={(e) => {
                    const [year, month, day] = e.target.value.split("-").map(Number);
                    const newDate = new Date(startDateTime);
                    newDate.setFullYear(year, month - 1, day);
                    if (!isNaN(newDate.getTime())) setStartDateTime(newDate);
                  }}
                  className="w-full bg-transparent text-base outline-none"
                />
              </div>

              {/* Start/End Time */}
              <div
                className={cn(
                  "grid gap-1",
                  selectedService ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                <div className="relative">
                  <label className="absolute -top-1.5 left-2 bg-background px-1 text-[10px] text-muted-foreground z-10">
                    {t("appointment.start")}
                  </label>
                  <div
                    className={cn(
                      "rounded-lg border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring",
                      hasOverlap ? "border-red-300 bg-red-50" : "border-input"
                    )}
                  >
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
                      className="w-full bg-transparent text-base outline-none"
                    />
                  </div>
                </div>
                {selectedService && (
                  <div className="relative">
                    <label className="absolute -top-1.5 left-2 bg-background px-1 text-[10px] text-muted-foreground z-10">
                      {t("appointment.end")}
                    </label>
                    <div
                      className={cn(
                        "rounded-lg border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring",
                        hasOverlap ? "border-red-300 bg-red-50" : "border-input"
                      )}
                    >
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
                          if (newDuration >= 15) {
                            setCustomDuration(newDuration);
                          }
                        }}
                        step="900"
                        className="w-full bg-transparent text-base outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedService && (
                <>
                  {/* Duration display + quick adjust */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-muted-foreground">
                      {t("appointment.duration")}:{" "}
                      <span className="font-medium text-foreground">
                        {customDuration} {t("services.minutes")}
                      </span>
                      {customDuration !== selectedService.durationMinutes && (
                        <button
                          type="button"
                          onClick={() => setCustomDuration(selectedService.durationMinutes)}
                          className="ml-2 text-xs underline hover:text-foreground"
                        >
                          {t("appointment.resetDuration")}
                        </button>
                      )}
                    </span>
                    {hasOverlap && (
                      <span className="text-sm text-red-600 font-medium">
                        {t("appointment.overlapsShort")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status (edit only) */}
          {mode === "edit" && (
            <div className="space-y-1">
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
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("appointment.notes")} ({t("common.optional")})</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring resize-none"
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
      </DialogContent>
    </Dialog>
  );
}
