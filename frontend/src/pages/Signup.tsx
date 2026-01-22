import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

type Status = "idle" | "loading" | "error";

export function Signup() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { signUp } = useAuth();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signUp(name, email, password);
      if (!result.ok) {
        setStatus("error");
        setMessage(
          "We couldn't create your account. It may already exist or signup is disabled."
        );
        return;
      }

      form.reset();
      setStatus("idle");
      navigate("/app", { replace: true });
    } catch {
      setStatus("error");
      setMessage("A network error occurred. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Planner
            </p>
            <p className="text-lg font-semibold text-foreground">Salon Daybook</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">Create your owner account</h1>
            <p className="text-sm text-muted-foreground">
              This creates the first (and only) owner for the salon.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              Full name
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="text"
                  name="name"
                  placeholder="Alex Carter"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Email
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="email"
                  name="email"
                  placeholder="owner@salon.com"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-background px-4 py-3 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  required
                />
              </div>
            </label>
            <Button className="w-full" size="lg" disabled={status === "loading"}>
              {status === "loading" ? "Creating account..." : "Create account"}
            </Button>
          </form>

          {message && status === "error" ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have access?{" "}
            <Link to="/login" className="font-semibold text-foreground">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
