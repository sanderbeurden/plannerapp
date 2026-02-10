import {
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const stats = [
  { label: "Active offer", value: "Free for now" },
  { label: "Setup time", value: "Under 2 minutes" },
  { label: "Who it is for", value: "Solo service owners" },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Daily timeline clarity",
    description: "See your full day at once so you can spot gaps and overlaps fast.",
  },
  {
    icon: Scissors,
    title: "Clients + services together",
    description: "Every booking stays linked to the right client and service details.",
  },
  {
    icon: Clock,
    title: "Reliable time handling",
    description: "Time is stored in UTC and shown in local time in your browser.",
  },
];

const previewStartHour = 9;
const previewEndHour = 13;
const previewHourHeight = 64;
const previewLeadSlotHeight = previewHourHeight / 4;
const previewAppointmentOffsetPx = 4;
const previewNowMinutes = 10 * 60 + 45;
const previewHours = Array.from(
  { length: previewEndHour - previewStartHour },
  (_, i) => previewStartHour + i
);

type PreviewAppointment = {
  start: string;
  end: string;
  client: string;
  service: string;
  status: "confirmed" | "hold" | "cancelled";
};

const previewAppointments: PreviewAppointment[] = [
  {
    start: "09:00",
    end: "09:45",
    client: "Nia Carter",
    service: "Skin fade + beard",
    status: "confirmed",
  },
  {
    start: "10:00",
    end: "10:30",
    client: "Luis Harper",
    service: "Classic taper",
    status: "hold",
  },
  {
    start: "11:15",
    end: "12:15",
    client: "Zara Musa",
    service: "Silk press",
    status: "confirmed",
  },
];

const previewStatusClass: Record<PreviewAppointment["status"], string> = {
  confirmed: "status-confirmed",
  hold: "status-hold",
  cancelled: "status-cancelled",
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const trustSignals = [
  {
    icon: MessageSquare,
    title: "Built with direct feedback",
    description: "Early users shape what gets shipped next.",
  },
  {
    icon: ShieldCheck,
    title: "No credit card required",
    description: "Sign up and start testing the planner right away.",
  },
  {
    icon: CheckCircle2,
    title: "Focused on one outcome",
    description: "Cleaner booking days with less admin overhead.",
  },
];

const outcomes = [
  {
    title: "Avoid scheduling chaos",
    description:
      "Keep every booking in one calm timeline so your next move is always clear.",
  },
  {
    title: "Reduce admin switching",
    description:
      "Manage appointments, clients, and services in one place instead of scattered notes.",
  },
  {
    title: "Make feedback matter",
    description:
      "You get free access now, and your feedback directly influences the roadmap.",
  },
];

const steps = [
  {
    title: "Create your owner account",
    description: "Start in minutes with no credit card.",
  },
  {
    title: "Add services and clients",
    description: "Set up your regular offerings and customer details once.",
  },
  {
    title: "Run your day from one planner",
    description: "Book, review, and adjust appointments without losing context.",
  },
];

const faq = [
  {
    question: "Is it really free right now?",
    answer:
      "Yes. The planner is free during this feedback beta while we validate what solo owners need most.",
  },
  {
    question: "Who is this built for?",
    answer:
      "Solo barbers, beauticians, and other appointment-based service professionals who run their own schedule.",
  },
  {
    question: "What should I send as feedback?",
    answer:
      "Share friction points in your daily flow, missing features, and anything that slows down booking management.",
  },
  {
    question: "Can I start quickly?",
    answer:
      "Yes. Setup is designed to be fast so you can begin planning your day in just a few minutes.",
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartClick = () => {
    navigate("/signup");
  };

  const handleWatchDemoClick = () => {
    document.getElementById("preview")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-72 -left-16 h-64 w-64 rounded-full bg-accent/70 blur-3xl" />
        <div className="absolute right-0 top-[30rem] h-72 w-72 rounded-full bg-secondary/80 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t("landing.tagline")}
              </p>
              <p className="text-lg font-semibold">{t("landing.title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/login">{t("landing.signIn")}</Link>
            </Button>
            <Button className="hidden md:inline-flex" onClick={handleStartClick}>
              Start free beta
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-8 shadow-soft md:p-10">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-[6rem] bg-primary/10" />
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Feedback beta: free for now
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                Run your booking day from one planner, not five tools.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Sjedule helps solo service owners manage appointments, services,
                and clients in one calm workspace. Join free now and shape what
                we build next with your feedback.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Single timeline for appointments, clients, and services.",
                  "Cleaner day planning with fewer booking collisions.",
                  "UTC storage with local-time display for accuracy.",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={handleStartClick}>
                  Start free beta
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleWatchDemoClick}>
                  See live preview
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card. Free during beta. Built from user feedback.
              </p>
              <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              id="preview"
              className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
            >
              <div className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground"
                    aria-label="Previous day preview"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-1.5">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold tracking-tight">
                      Tuesday, February 10
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground"
                    aria-label="Next day preview"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  <Clock className="h-3 w-3" />
                  Local time
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border/70 bg-background/60 px-4 py-2.5">
                <div className="relative flex rounded-[10px] border border-border/30 bg-muted/60 p-[2px]">
                  <span className="rounded-lg bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0.5px_1px_rgba(0,0,0,0.06)]">
                    Day
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    Week
                  </span>
                </div>
                <Button size="sm" className="h-8 rounded-lg px-3 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  New appointment
                </Button>
              </div>

              <div className="relative h-[18rem] overflow-hidden bg-card">
                <div className="relative flex pt-3">
                  <div className="relative w-16 flex-shrink-0 border-r border-border">
                    <div style={{ height: previewLeadSlotHeight }} />
                    {previewHours.map((hour) => (
                      <div
                        key={`preview-hour-${hour}`}
                        className="relative"
                        style={{ height: previewHourHeight }}
                      >
                        <span className="absolute -top-2 right-3 text-xs text-muted-foreground">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative flex-1">
                    <div
                      className="relative border-b border-dashed border-border/50"
                      style={{ height: previewLeadSlotHeight }}
                    />
                    {previewHours.map((hour, hourIndex) => (
                      <div
                        key={`preview-grid-${hour}`}
                        className="relative border-b border-border"
                        style={{ height: previewHourHeight }}
                      >
                        {hourIndex % 2 === 0 && (
                          <div className="pointer-events-none absolute inset-0 bg-muted/20" />
                        )}
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50"
                          style={{ top: previewHourHeight * 0.25 }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50"
                          style={{ top: previewHourHeight * 0.5 }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/50"
                          style={{ top: previewHourHeight * 0.75 }}
                        />
                      </div>
                    ))}

                    <div className="absolute bottom-0 left-0 right-0 top-3">
                      <div
                        className="pointer-events-none absolute left-0 right-0 border-t border-primary/50"
                        style={{
                          top:
                            ((previewNowMinutes - previewStartHour * 60) /
                              60) *
                            previewHourHeight,
                        }}
                      >
                        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary/80" />
                      </div>

                      {previewAppointments.map((slot) => {
                        const startMinutes =
                          timeToMinutes(slot.start) - previewStartHour * 60;
                        const durationMinutes =
                          timeToMinutes(slot.end) - timeToMinutes(slot.start);
                        const top =
                          (startMinutes / 60) * previewHourHeight +
                          previewAppointmentOffsetPx;
                        const height = (durationMinutes / 60) * previewHourHeight;
                        const blockHeight = Math.max(height, 24);
                        const showDetails = blockHeight >= 50;

                        return (
                          <div
                            key={`${slot.start}-${slot.client}`}
                            className={`absolute left-1 right-2 overflow-hidden rounded-xl border-l-4 bg-[var(--status-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${previewStatusClass[slot.status]}`}
                            style={{
                              top,
                              height: blockHeight,
                              borderLeftColor: "var(--status-color)",
                            }}
                          >
                            <div className={`flex h-full flex-col ${showDetails ? "p-2" : "p-1.5"}`}>
                              {showDetails ? (
                                <>
                                  <span className="truncate text-xs font-semibold leading-tight text-foreground">
                                    {slot.service}
                                  </span>
                                  <span className="truncate text-[11px] text-muted-foreground">
                                    {slot.client}
                                  </span>
                                  <span className="mt-auto text-[10px] text-muted-foreground">
                                    {slot.start} - {slot.end}
                                  </span>
                                </>
                              ) : (
                                <div className="flex items-start justify-between gap-1">
                                  <span className="truncate text-[11px] font-semibold leading-tight text-foreground">
                                    {slot.service}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {slot.start} - {slot.end}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-border/70 bg-background/50 p-3 text-xs font-medium text-muted-foreground">
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  Day view with status colors
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-2">
                  Drag &amp; drop in the real app
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {trustSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <div
                key={signal.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-lg font-semibold">{signal.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {signal.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Why owners switch
            </p>
            <h2 className="text-2xl font-semibold md:text-3xl">
              Built to protect your schedule and your focus.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <div
                key={outcome.title}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <h3 className="text-lg font-semibold">{outcome.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {outcome.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              How it works
            </p>
            <h2 className="text-2xl font-semibold md:text-3xl">
              Three steps to get value quickly.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              FAQ
            </p>
            <h2 className="text-2xl font-semibold md:text-3xl">
              Everything owners ask before joining.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-primary/30 bg-primary/10 p-8 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Pricing
            </p>
            <h2 className="text-2xl font-semibold md:text-3xl">
              Use Sjedule free for now and help shape the roadmap.
            </h2>
            <p className="text-sm text-muted-foreground">
              Join the feedback beta, run your real schedule, and tell us what
              to improve next.
            </p>
          </div>
          <Button size="lg" onClick={handleStartClick}>
            Create owner account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      </main>

      <footer className="border-t border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{t("landing.title")}</p>
            <p>{t("landing.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Support", href: "/support" },
            ].map(link => (
              <Link
                key={link.label}
                to={link.href}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`${link.label} page`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
