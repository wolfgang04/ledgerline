import { useMutation } from "@tanstack/react-query";
import type { AuthResponse, LoginInput } from "./types";
import { signup, login } from "./api";

export function useSignupMutation() {
  return useMutation({ mutationFn: signup });
}

export function useLoginMutation() {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: login,
  });
}
