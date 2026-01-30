import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { SettingsProvider } from "@/lib/settings";
import { Clients } from "@/pages/Clients";
import { Dashboard } from "@/pages/Dashboard";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { ResetPassword } from "@/pages/ResetPassword";
import { ResetPasswordRequest } from "@/pages/ResetPasswordRequest";
import { Services } from "@/pages/Services";
import { Settings } from "@/pages/Settings";
import { Signup } from "@/pages/Signup";
import { VerifyEmail } from "@/pages/VerifyEmail";
import { Analytics } from "@vercel/analytics/react";

export function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <I18nProvider>
          <AuthProvider>
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
            <Analytics />
          </AuthProvider>
        </I18nProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
