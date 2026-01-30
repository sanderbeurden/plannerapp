import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppointmentBlock } from "./AppointmentBlock";
import type { AppointmentWithDetails } from "@/types";

const baseAppointment: AppointmentWithDetails = {
  id: "apt-1",
  clientId: "client-1",
  serviceId: "service-1",
  startUtc: "2026-01-29T10:00:00",
  endUtc: "2026-01-29T11:00:00",
  status: "confirmed",
  notes: null,
  createdAt: "2026-01-01T00:00:00",
  client: {
    id: "client-1",
    firstName: "Jane",
    lastName: "Doe",
    fullName: "Jane Doe",
    email: null,
    phone: null,
    notes: null,
    createdAt: "2026-01-01T00:00:00",
  },
  service: {
    id: "service-1",
    name: "Haircut",
    durationMinutes: 60,
    priceCents: 5000,
    createdAt: "2026-01-01T00:00:00",
  },
};

describe("AppointmentBlock", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders compact layout when height is small", () => {
    render(
      <AppointmentBlock
        appointment={baseAppointment}
        startHour={8}
        hourHeight={30}
        onClick={() => {}}
      />
    );

    expect(screen.getByText("Haircut")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 11:00")).toBeInTheDocument();
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  test("renders details when height is large and handles clicks", () => {
    const onClick = vi.fn();
    render(
      <AppointmentBlock
        appointment={baseAppointment}
        startHour={8}
        hourHeight={90}
        onClick={onClick}
      />
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 11:00")).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
    screen.getByText("Haircut").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
