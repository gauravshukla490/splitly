import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { ProtectedRoute } from "./components/protected-route";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { VerifyOtpPage } from "./pages/verify-otp";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { ResetPasswordPage } from "./pages/reset-password";
import { DashboardPage } from "./pages/dashboard";
import { GroupDetailPage } from "./pages/group-detail";
import { ContactsPage } from "./pages/contacts";
import { NewExpensePage } from "./pages/new-expense";
import { PersonPage } from "./pages/person";
import { SettlementPage } from "./pages/settlement";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses/new"
            element={
              <ProtectedRoute>
                <NewExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/person/:id"
            element={
              <ProtectedRoute>
                <PersonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settlements/:type/:id"
            element={
              <ProtectedRoute>
                <SettlementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
