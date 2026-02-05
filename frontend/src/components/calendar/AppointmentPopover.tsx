import { useEffect, useRef } from "react";
import { Clock, User, X, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { formatTime, formatDateLocalized, formatDuration, getDurationMinutes } from "./hooks/useDateUtils";

type AppointmentPopoverProps = {
  appointment: AppointmentWithDetails;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
};

export function AppointmentPopover({
  appointment,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { t, monthNames } = useTranslation();

  useEffect(() => {
    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the close button on mount
    closeButtonRef.current?.focus();

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    // Focus trap
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !ref.current) return;

      const focusableElements = ref.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
      // Restore focus on unmount
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const start = new Date(appointment.startUtc);
  const end = new Date(appointment.endUtc);
  const duration = getDurationMinutes(start, end);

  const statusConfig = {
    confirmed: {
      label: t("appointment.confirmed"),
      icon: CheckCircle,
      className: "text-status-confirmed",
    },
    hold: {
      label: t("appointment.hold"),
      icon: AlertCircle,
      className: "text-status-hold",
    },
    cancelled: {
      label: t("appointment.cancelled"),
      icon: X,
      className: "text-status-cancelled",
    },
  }[appointment.status];

  const titleId = `appointment-title-${appointment.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 md:bg-background/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Sheet / Dialog */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative w-full bg-card shadow-[0_-4px_40px_rgba(0,0,0,0.1)] pb-safe",
          // Mobile: bottom sheet
          "rounded-t-2xl p-5 pt-3 animate-slide-up",
          // Desktop: centered dialog
          "md:max-w-md md:rounded-2xl md:p-6 md:animate-appointment-appear md:shadow-soft md:border md:border-border"
        )}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pb-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 id={titleId} className="text-xl font-semibold tracking-tight">{appointment.service.name}</h3>
            <div className={cn("mt-1.5 flex items-center gap-1.5 text-sm", statusConfig.className)}>
              <statusConfig.icon className="h-4 w-4" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 -mr-1 -mt-1"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{appointment.client.fullName}</div>
              {appointment.client.phone && (
                <div className="text-muted-foreground">{appointment.client.phone}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">
                {formatTime(start)} - {formatTime(end)}
              </div>
              <div className="text-muted-foreground">
                {formatDateLocalized(start, monthNames)} · {formatDuration(duration)}
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="rounded-xl bg-muted/40 p-3.5 text-sm">
              <div className="text-xs font-medium text-muted-foreground mb-1">{t("appointment.notes")}</div>
              <div>{appointment.notes}</div>
            </div>
          )}
        </div>

        {appointment.status !== "cancelled" && (
          <div className="mt-5 grid grid-cols-2 md:flex md:flex-wrap gap-2">
            {appointment.status === "hold" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("confirmed")}
                className="h-10 md:h-9"
              >
                <CheckCircle className="h-4 w-4" />
                {t("common.confirm")}
              </Button>
            )}
            {appointment.status === "confirmed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("hold")}
                className="h-10 md:h-9"
              >
                <AlertCircle className="h-4 w-4" />
                {t("appointment.hold")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit} className="h-10 md:h-9">
              <Edit className="h-4 w-4" />
              {t("common.edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange("cancelled")}
              className="h-10 md:h-9 text-status-cancelled hover:text-status-cancelled"
            >
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </Button>
          </div>
        )}

        <div className="mt-4 flex justify-end border-t border-border/50 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive h-10 md:h-9"
          >
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
