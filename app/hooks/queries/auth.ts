import { useMutation } from "@tanstack/react-query";
import { api, type AuthResponse } from "../../lib/api";

export type SignupInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

async function signup(payload: SignupInput) {
  return (await api.post<{ msg: string }>("/auth/signup", payload)).data;
}

async function login(payload: LoginInput) {
  return (await api.post<AuthResponse>("/auth/login", payload)).data;
}

export function useSignupMutation() {
  return useMutation({ mutationFn: signup });
}

export function useLoginMutation() {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: login,
  });
}