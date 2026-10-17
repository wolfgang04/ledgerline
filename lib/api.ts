import axios from "axios";
import { clearSession, getToken } from "@/lib/session";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();
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
      if (error.config?.headers?.Authorization === `Bearer ${getToken()}`)
        clearSession();
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
