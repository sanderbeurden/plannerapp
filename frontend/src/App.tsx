import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { SettingsProvider } from "@/lib/settings";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { ResetPassword } from "@/pages/ResetPassword";
import { ResetPasswordRequest } from "@/pages/ResetPasswordRequest";
import { Analytics } from "@vercel/analytics/react";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Services = lazy(() => import("@/pages/Services").then((m) => ({ default: m.Services })));
const Clients = lazy(() => import("@/pages/Clients").then((m) => ({ default: m.Clients })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <I18nProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/reset" element={<ResetPasswordRequest />} />
                <Route path="/reset/confirm" element={<ResetPassword />} />
                <Route element={<RequireAuth />}>
                  <Route path="/app" element={<Dashboard />} />
                  <Route path="/app/services" element={<Services />} />
                  <Route path="/app/clients" element={<Clients />} />
                  <Route path="/app/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Landing />} />
              </Routes>
            </Suspense>
            <Analytics />
          </AuthProvider>
        </I18nProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
