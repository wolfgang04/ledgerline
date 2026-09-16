import axios from "axios";

export type Role = "organization_admin" | "employee" | "finance" | "manager";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Organization = {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
};

export type Invitation = {
  id: number;
  email: string;
  role: Role;
  created_at: string;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("financial-operations-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const responseData = error.response?.data;
    return responseData?.message ?? error.message;
  }
  return "Something went wrong. Please try again.";
}