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
    colSpan: "col-span-1 md:col-span-2",
  },
  {
    icon: Scissors,
    title: "Clients + services together",
    description: "Every booking stays linked to the right client and service details.",
    colSpan: "col-span-1",
  },
  {
    icon: Clock,
    title: "Reliable time handling",
    description: "Time is stored in UTC and shown in local time in your browser.",
    colSpan: "col-span-1 md:col-span-3",
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
      block: "center",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Modern sweeping background blobs */}
        <div className="absolute top-[-10%] right-[-5%] h-[50vw] w-[50vw] rounded-full bg-primary/10 blur-[100px] animate-pulse-slow mix-blend-multiply opacity-70" />
        <div className="absolute top-[40%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-accent/60 blur-[100px] mix-blend-multiply opacity-50" />
        <div className="absolute bottom-[-10%] right-[10%] h-[60vw] w-[60vw] rounded-full bg-secondary/80 blur-[120px] mix-blend-multiply opacity-60" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <img
              src="/icons/logo 42x42.svg"
              alt={`${t("landing.title")} logo`}
              width={42}
              height={42}
              className="transition-transform group-hover:scale-105 rounded-xl shadow-lg shrink-0"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">
                {t("landing.tagline")}
              </p>
              <p className="font-display text-xl font-bold tracking-tight text-foreground/90">{t("landing.title")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:inline-flex font-semibold hover:bg-primary/5">
              <Link to="/login">{t("landing.signIn")}</Link>
            </Button>
            <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all px-6 font-semibold" onClick={handleStartClick}>
              Start free beta
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-16 md:py-24 animate-fade-in">
        <section className="relative grid items-center gap-16 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Feedback beta: free for now
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-[5rem] text-balance">
              Run your booking day from one planner.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground/90 md:text-xl font-medium leading-relaxed">
              Sjedule helps solo service owners manage appointments, services,
              and clients in one calm workspace. Experience a cleaner day planning flow.
            </p>
            <ul className="space-y-3 font-medium text-foreground/80">
              {[
                "Single timeline for appointments, clients, and services.",
                "Cleaner day planning with fewer booking collisions.",
                "UTC storage with local-time display for accuracy.",
              ].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button size="lg" className="rounded-full h-14 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all" onClick={handleStartClick}>
                Start free beta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="secondary" className="rounded-full h-14 px-8 text-base bg-secondary/80 hover:bg-secondary border border-border/50 backdrop-blur-sm transition-all" onClick={handleWatchDemoClick}>
                See live preview
              </Button>
            </div>
            <div className="grid gap-6 border-t border-border/40 pt-8 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="font-display text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            id="preview"
            className="relative animate-slide-fade-left" style={{ animationDelay: "250ms" }}
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/20 to-accent/20 blur-2xl opacity-50" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-border/40 bg-card/50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/50 text-muted-foreground hover:bg-background transition-colors border border-border/40 shadow-sm"
                    aria-label="Previous day preview"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2 border border-primary/10">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold tracking-tight text-foreground">
                      Tuesday, February 10
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/50 text-muted-foreground hover:bg-background transition-colors border border-border/40 shadow-sm"
                    aria-label="Next day preview"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1.5 text-xs font-bold text-secondary-foreground border border-border/40">
                  <Clock className="h-3.5 w-3.5" />
                  Local time
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-border/30 bg-background/30 px-5 py-3">
                <div className="relative flex rounded-xl border border-border/40 bg-muted/40 p-1">
                  <span className="rounded-lg bg-card px-4 py-1.5 text-xs font-bold text-foreground shadow-sm">
                    Day
                  </span>
                  <span className="px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    Week
                  </span>
                </div>
                <Button size="sm" className="h-9 rounded-xl px-4 text-xs font-bold shadow-md shadow-primary/10">
                  <Plus className="mr-1 h-4 w-4" />
                  New booking
                </Button>
              </div>

              <div className="relative h-[22rem] overflow-hidden bg-card/40 backdrop-blur-sm">
                <div className="relative flex pt-4">
                  <div className="relative w-16 flex-shrink-0 border-r border-border/40">
                    <div style={{ height: previewLeadSlotHeight }} />
                    {previewHours.map((hour) => (
                      <div
                        key={`preview-hour-${hour}`}
                        className="relative"
                        style={{ height: previewHourHeight }}
                      >
                        <span className="absolute -top-2 right-3 text-[11px] font-semibold text-muted-foreground">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative flex-1">
                    <div
                      className="relative border-b border-dashed border-border/30"
                      style={{ height: previewLeadSlotHeight }}
                    />
                    {previewHours.map((hour, hourIndex) => (
                      <div
                        key={`preview-grid-${hour}`}
                        className="relative border-b border-border/40"
                        style={{ height: previewHourHeight }}
                      >
                        {hourIndex % 2 === 0 && (
                          <div className="pointer-events-none absolute inset-0 bg-muted/10" />
                        )}
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/30"
                          style={{ top: previewHourHeight * 0.25 }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/30"
                          style={{ top: previewHourHeight * 0.5 }}
                        />
                        <div
                          className="pointer-events-none absolute left-0 right-0 border-b border-dashed border-border/30"
                          style={{ top: previewHourHeight * 0.75 }}
                        />
                      </div>
                    ))}

                    <div className="absolute bottom-0 left-0 right-0 top-4">
                      <div
                        className="pointer-events-none absolute left-0 right-0 border-t-[1.5px] border-primary/60 z-10"
                        style={{
                          top:
                            ((previewNowMinutes - previewStartHour * 60) /
                              60) *
                            previewHourHeight,
                        }}
                      >
                        <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-primary shadow-sm" />
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
                        const blockHeight = Math.max(height, 28);
                        const showDetails = blockHeight >= 50;

                        return (
                          <div
                            key={`${slot.start}-${slot.client}`}
                            className={`absolute left-2 right-3 overflow-hidden rounded-xl border-l-[4px] bg-[var(--status-bg)] shadow-sm hover:shadow-md transition-shadow cursor-pointer ${previewStatusClass[slot.status]} backdrop-blur-md bg-opacity-90`}
                            style={{
                              top,
                              height: blockHeight,
                              borderLeftColor: "var(--status-color)",
                            }}
                          >
                            <div className={`flex h-full flex-col ${showDetails ? "p-2.5" : "p-1.5 px-2.5"}`}>
                              {showDetails ? (
                                <>
                                  <span className="truncate text-xs font-bold leading-tight text-foreground">
                                    {slot.service}
                                  </span>
                                  <span className="truncate text-[11px] font-medium text-muted-foreground mt-0.5">
                                    {slot.client}
                                  </span>
                                  <span className="mt-auto text-[10px] font-bold text-muted-foreground/80">
                                    {slot.start} - {slot.end}
                                  </span>
                                </>
                              ) : (
                                <div className="flex w-full items-center justify-between gap-2">
                                  <span className="truncate text-[11px] font-bold leading-tight text-foreground">
                                    {slot.service}
                                  </span>
                                  <span className="shrink-0 text-[10px] font-bold text-muted-foreground/80">
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
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-foreground">
              Everything in one view
            </h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              Tools shouldn't complicate your day. We organized the essentials into a clean, modern interface.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 auto-rows-min">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-[2rem] border border-white/40 bg-card/60 p-8 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-card/90 ${feature.colSpan}`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <Icon className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-muted text-secondary-foreground shadow-sm mb-6 border border-white/50">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-base text-muted-foreground font-medium max-w-md">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust & Outcomes Section (Bento Grid) */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/40 bg-primary/5 p-10 md:p-12 shadow-lg backdrop-blur-md bg-gradient-to-br from-primary/10 to-transparent">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                Why owners switch
              </p>
              <h2 className="font-display text-3xl font-bold md:text-4xl text-foreground leading-tight">
                Built to protect your schedule and your focus.
              </h2>
            </div>
            <div className="mt-10 grid gap-6">
              {outcomes.map((outcome) => (
                <div key={outcome.title} className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{outcome.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground font-medium leading-relaxed">
                      {outcome.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div
                  key={signal.title}
                  className="group rounded-[2rem] border border-white/40 bg-card/60 p-8 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:bg-card/90 flex items-center gap-6"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground border border-border/50 transition-transform group-hover:scale-105">
                    <Icon className="h-6 w-6 opacity-80" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">{signal.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground font-medium">
                      {signal.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-[2.5rem] border border-border/40 bg-card/40 p-10 md:p-16 shadow-xl backdrop-blur-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] translate-x-1/3 -translate-y-1/3 bg-primary/5 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center space-y-4 mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              How it works
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              Three steps to calm.
            </h2>
          </div>
          <div className="relative z-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center p-6"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-display font-bold text-primary-foreground shadow-lg shadow-primary/20">
                  {index + 1}
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-base text-muted-foreground font-medium max-w-[16rem]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-primary/5 p-10 md:p-16 shadow-2xl backdrop-blur-xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 transition-opacity group-hover:opacity-100 duration-700" />
          <div className="relative z-10 flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 max-w-2xl">
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl text-foreground">
                Join the feedback beta today.
              </h2>
              <p className="text-lg text-muted-foreground font-medium">
                Run your real schedule for free, and tell us what to build next.
                No credit card needed to start.
              </p>
            </div>
            <div className="shrink-0">
              <Button size="lg" className="rounded-full h-16 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all" onClick={handleStartClick}>
                Create owner account
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="grid md:grid-cols-[1fr,2fr] gap-12 items-start py-8">
          <div className="space-y-4 sticky top-32">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Common questions
            </h2>
            <p className="text-muted-foreground font-medium">
              Everything owners ask before joining the platform.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {faq.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-white/30 bg-card/60 p-6 backdrop-blur-sm shadow-md hover:bg-card/80 transition-colors"
              >
                <h3 className="font-display text-lg font-bold">{item.question}</h3>
                <p className="mt-3 text-sm text-muted-foreground font-medium leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icons/logo 36x36.svg"
              alt={`${t("landing.title")} logo`}
              width={36}
              height={36}
              className="opacity-90 rounded-lg shadow-sm shrink-0"
            />
            <div className="space-y-0.5 text-sm text-muted-foreground font-medium">
              <p className="font-bold text-foreground font-display text-base tracking-tight">{t("landing.title")}</p>
              <p>{t("landing.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-8 text-sm font-semibold text-muted-foreground">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Support", href: "/support" },
            ].map(link => (
              <Link
                key={link.label}
                to={link.href}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
