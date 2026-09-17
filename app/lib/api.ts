import axios from "axios";

export type Role = "organization_admin" | "employee" | "finance" | "manager";
export type UserRole = Role | "platform_admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
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
  role?: Role;
};

export type OrganizationMember = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
};

export type Invitation = {
  id: number;
  organization_id: number;
  organization_name: string;
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/")
    ) {
      window.localStorage.removeItem("financial-operations-token");
      window.localStorage.removeItem("financial-operations-user");
      window.location.replace("/");
    }

    return Promise.reject(error);
  },
);

export function getApiError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const responseData = error.response?.data;
    return responseData?.message ?? error.message;
  }
  return "Something went wrong. Please try again.";
}
