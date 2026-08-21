import { apiFetch } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export function signup(data: { name: string; email: string; password: string }) {
  return apiFetch<{ message: string; userId: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function verifyOtp(data: { userId: string; code: string }) {
  return apiFetch<{ message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { identifier: string; password: string }) {
  return apiFetch<{ message: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function forgotPassword(data: { identifier: string }) {
  return apiFetch<{ message: string; userId?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resetPassword(data: {
  userId: string;
  code: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
