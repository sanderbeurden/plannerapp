import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/components/RequireAuth";
import { AuthProvider } from "@/lib/auth";
import { Clients } from "@/pages/Clients";
import { Dashboard } from "@/pages/Dashboard";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Services } from "@/pages/Services";
import { Signup } from "@/pages/Signup";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/services" element={<Services />} />
            <Route path="/app/clients" element={<Clients />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
