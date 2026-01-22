import { useEffect, useRef } from "react";
import { Clock, User, X, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types";
import { formatTime, formatDate, formatDuration, getDurationMinutes } from "./hooks/useDateUtils";

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
      label: "Confirmed",
      icon: CheckCircle,
      className: "text-status-confirmed",
    },
    hold: {
      label: "On Hold",
      icon: AlertCircle,
      className: "text-status-hold",
    },
    cancelled: {
      label: "Cancelled",
      icon: X,
      className: "text-status-cancelled",
    },
  }[appointment.status];

  const titleId = `appointment-title-${appointment.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft animate-appointment-appear"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 id={titleId} className="text-xl font-semibold">{appointment.service.name}</h3>
            <div className={cn("mt-1 flex items-center gap-1.5 text-sm", statusConfig.className)}>
              <statusConfig.icon className="h-4 w-4" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{appointment.client.name}</div>
              {appointment.client.phone && (
                <div className="text-muted-foreground">{appointment.client.phone}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {formatTime(start)} - {formatTime(end)}
              </div>
              <div className="text-muted-foreground">
                {formatDate(start)} · {formatDuration(duration)}
              </div>
            </div>
          </div>

          {appointment.notes && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
              <div>{appointment.notes}</div>
            </div>
          )}
        </div>

        {appointment.status !== "cancelled" && (
          <div className="mt-6 flex flex-wrap gap-2">
            {appointment.status === "hold" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("confirmed")}
              >
                <CheckCircle className="h-4 w-4" />
                Confirm
              </Button>
            )}
            {appointment.status === "confirmed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange("hold")}
              >
                <AlertCircle className="h-4 w-4" />
                Put on Hold
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange("cancelled")}
              className="text-status-cancelled hover:text-status-cancelled"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}

        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
