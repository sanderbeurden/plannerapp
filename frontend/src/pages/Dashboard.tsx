import { LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/calendar";
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
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
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-6">
        <Calendar />
      </main>
    </div>
  );
}
