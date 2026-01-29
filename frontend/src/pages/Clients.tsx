import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Mail, Phone, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useClients } from "@/components/calendar/hooks/useAppointments";
import type { Client } from "@/types";

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const { clients, loading, createClient, updateClient, deleteClient } = useClients(searchQuery);
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setNotes("");
  };

  const startEditing = (client: Client) => {
    setEditingId(client.id);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setNotes(client.notes ?? "");
    setIsCreating(false);
    setDeleteConfirm(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    const result = await createClient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (result) {
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    const result = await updateClient(id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    if (result) {
      setEditingId(null);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    const result = await deleteClient(id);
    setSaving(false);
    if (result.success) {
      setDeleteConfirm(null);
    } else {
      const errorKey =
        result.errorCode === "CLIENT_HAS_APPOINTMENTS"
          ? "clients.errors.deleteHasAppointments"
          : "clients.errors.deleteFailed";
      setError(t(errorKey));
    }
  };

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
            <h1 className="text-lg font-semibold">{t("clients.title")}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-6">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("clients.searchPlaceholder")}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Add new button or form */}
          {isCreating ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t("clients.firstName")} *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(capitalizeFirst(e.target.value))}
                    placeholder={t("clients.firstName")}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("clients.lastName")} *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(capitalizeFirst(e.target.value))}
                    placeholder={t("clients.lastName")}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t("clients.email")}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("clients.phone")}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("appointment.notes")}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={`${t("appointment.notes")}...`}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!firstName.trim() || !lastName.trim() || saving}
                  >
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
              {t("clients.addNew")}
            </Button>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Clients list */}
          {!loading && clients.length === 0 && !isCreating ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? t("clients.noClients") : t("clients.noClients")}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("clients.noClientsHint")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {editingId === client.id ? (
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium">{t("clients.firstName")} *</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(capitalizeFirst(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("clients.lastName")} *</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(capitalizeFirst(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">{t("clients.email")}</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="client@example.com"
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t("clients.phone")}</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t("appointment.notes")}</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={`${t("appointment.notes")}...`}
                          rows={2}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                          <X className="h-4 w-4" />
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={() => handleUpdate(client.id)}
                          disabled={!firstName.trim() || !lastName.trim() || saving}
                        >
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Check className="h-4 w-4" />
                          {t("common.save")}
                        </Button>
                      </div>
                    </div>
                  ) : deleteConfirm === client.id ? (
                    <div className="p-4 space-y-3">
                      <p className="font-medium">{t("clients.deleteConfirm", { name: client.fullName })}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("clients.deleteWarning")}
                      </p>
                      {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setDeleteConfirm(null); setError(null); }} disabled={saving}>
                          {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(client.id)} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{client.fullName}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          {client.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                        {client.notes && (
                          <p className="mt-1 text-sm text-muted-foreground truncate">
                            {client.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(client)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setError(null); setDeleteConfirm(client.id); }}
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
