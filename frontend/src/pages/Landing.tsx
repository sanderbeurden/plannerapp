import { CalendarCheck, Clock, Scissors, Sparkles, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const stats = [
  { label: "Setup time", value: "Under 2 minutes" },
  { label: "Daily clarity", value: "No double-bookings" },
  { label: "Built for", value: "Solo owners" },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Plan the day in one view",
    description:
      "A calm timeline that keeps appointments visible without distractions.",
  },
  {
    icon: Scissors,
    title: "Services + clients linked",
    description: "Each slot connects the service and the client automatically.",
  },
  {
    icon: Clock,
    title: "Accurate time zones",
    description: "UTC in the database, local time in your browser.",
  },
];

const schedule = [
  {
    time: "09:00",
    client: "Nia Carter",
    service: "Skin fade + beard",
    duration: "45 min",
    status: "Confirmed",
  },
  {
    time: "10:00",
    client: "Luis Harper",
    service: "Classic taper",
    duration: "30 min",
    status: "Walk-in hold",
  },
  {
    time: "11:15",
    client: "Zara Musa",
    service: "Silk press",
    duration: "60 min",
    status: "Confirmed",
  },
];

export function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartClick = () => {
    navigate("/signup");
  };

  const handleWatchDemoClick = () => {
    document.getElementById("demo")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
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
            <Button className="hidden md:inline-flex" onClick={handleStartClick}>{t("landing.getStarted")}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Built for solo stylists
            </div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              The daily planner for solo barbers &amp; beauticians.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              Schedule clients, attach services, and keep a calm view of every
              visit. Built for one chair, one owner, and a smoother day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={handleStartClick}>
                Create owner account
              </Button>
              <Button size="lg" variant="outline" onClick={handleWatchDemoClick}>
                See how it works
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card. Setup in under two minutes.
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
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <span>Trusted by solo stylists (beta)</span>
              <span className="rounded-full border border-border px-3 py-1">
                Placeholder
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                Placeholder
              </span>
            </div>
          </div>

          <div
            id="demo"
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product preview</p>
                  <p className="text-lg font-semibold">Daily schedule</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                <Clock className="h-3 w-3" />
                Local time view
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {schedule.map((slot) => (
                <div
                  key={`${slot.time}-${slot.client}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-lg font-semibold">{slot.time}</div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {slot.duration}
                      </p>
                      <p className="text-base font-semibold">{slot.service}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <UserRound className="h-4 w-4" />
                        {slot.client}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
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

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Placeholder
            </p>
            <h3 className="text-lg font-semibold">Testimonials</h3>
            <p className="text-sm text-muted-foreground">
              Real owner quotes will live here once we launch the beta.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
            “Placeholder testimonial for a solo stylist who saved time.”
          </div>
          <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
            “Placeholder testimonial about clear scheduling and fewer no-shows.”
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Pricing
            </p>
            <h2 className="text-2xl font-semibold">
              Pricing will be announced soon.
            </h2>
            <p className="text-sm text-muted-foreground">
              Placeholder section for future pricing tiers and plans.
            </p>
          </div>
          <Button size="lg" onClick={handleStartClick}>
            Create owner account
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
