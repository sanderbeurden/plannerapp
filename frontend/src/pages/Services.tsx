import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useServices } from "@/components/calendar/hooks/useAppointments";
import type { Service } from "@/types";

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function Services() {
  const { services, loading, createService, updateService, deleteService } = useServices();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");

  const resetForm = () => {
    setName("");
    setDuration("30");
    setPrice("");
  };

  const startEditing = (service: Service) => {
    setEditingId(service.id);
    setName(service.name);
    setDuration(service.durationMinutes.toString());
    setPrice(service.priceCents ? (service.priceCents / 100).toFixed(2) : "");
    setIsCreating(false);
    setDeleteConfirm(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const parsePriceCents = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.round(parsed * 100);
  };

  const handleCreate = async () => {
    if (!name.trim() || !duration) return;
    setSaving(true);
    const result = await createService({
      name: name.trim(),
      durationMinutes: parseInt(duration),
      priceCents: parsePriceCents(price),
    });
    setSaving(false);
    if (result) {
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim() || !duration) return;
    setSaving(true);
    const result = await updateService(id, {
      name: name.trim(),
      durationMinutes: parseInt(duration),
      priceCents: parsePriceCents(price),
    });
    setSaving(false);
    if (result) {
      setEditingId(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await deleteService(id);
    setSaving(false);
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-6 py-4">
          <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("common.settings")}
            </p>
            <h1 className="text-lg font-semibold">{t("services.title")}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="space-y-4">
          {/* Add new button or form */}
          {isCreating ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t("services.serviceName")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(capitalizeFirst(e.target.value))}
                    placeholder={t("services.placeholder")}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t("services.duration")}</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="15">15 {t("services.minutes")}</option>
                      <option value="30">30 {t("services.minutes")}</option>
                      <option value="45">45 {t("services.minutes")}</option>
                      <option value="60">1 {t("services.hour")}</option>
                      <option value="90">1.5 {t("services.hours")}</option>
                      <option value="120">2 {t("services.hours")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("services.price")} ({t("common.optional")})</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleCreate} disabled={!name.trim() || saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("common.add")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                resetForm();
              }}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              {t("services.addNew")}
            </Button>
          )}

          {/* Services list */}
          {services.length === 0 && !isCreating ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">{t("services.noServices")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("services.noServicesHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {editingId === service.id ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium">{t("services.serviceName")}</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(capitalizeFirst(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">{t("services.duration")}</label>
                          <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="15">15 {t("services.minutes")}</option>
                            <option value="30">30 {t("services.minutes")}</option>
                            <option value="45">45 {t("services.minutes")}</option>
                            <option value="60">1 {t("services.hour")}</option>
                            <option value="90">1.5 {t("services.hours")}</option>
                            <option value="120">2 {t("services.hours")}</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t("services.price")} ({t("common.optional")})</label>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                          <X className="h-4 w-4" />
                          {t("common.cancel")}
                        </Button>
                        <Button onClick={() => handleUpdate(service.id)} disabled={!name.trim() || saving}>
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Check className="h-4 w-4" />
                          {t("common.save")}
                        </Button>
                      </div>
                    </div>
                  ) : deleteConfirm === service.id ? (
                    <div className="p-4 space-y-3">
                      <p className="font-medium">{t("services.deleteConfirm", { name: service.name })}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("services.deleteWarning")}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={saving}>
                          {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(service.id)} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {service.durationMinutes} {t("services.minutes")}
                          </span>
                          {service.priceCents !== null && (
                            <span>
                              ${(service.priceCents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(service)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(service.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
