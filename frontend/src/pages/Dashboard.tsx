import { CalendarDays, LogOut, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Planner
            </p>
            <p className="text-lg font-semibold text-foreground">Salon Daybook</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-muted-foreground md:block">
              {user?.name ?? "Owner"}
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">
              Welcome back{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="text-sm text-muted-foreground">
              Your calendar is clear today. Add your first appointment to get
              started.
            </p>
          </div>
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Add appointment
          </Button>
        </section>

        <section className="rounded-3xl border border-dashed border-border bg-background/60 p-10 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">No appointments yet</h2>
              <p className="text-sm text-muted-foreground">
                Once you add services and clients, your daily schedule will show
                up here.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/">View landing page</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
