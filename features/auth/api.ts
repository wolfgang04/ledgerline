import { api } from "@/lib/api";
import type { AuthResponse, SignupInput, LoginInput } from "./types";

export async function signup(payload: SignupInput) {
  return (await api.post<{ msg: string }>("/auth/signup", payload)).data;
}

export async function login(payload: LoginInput) {
  return (await api.post<AuthResponse>("/auth/login", payload)).data;
}
