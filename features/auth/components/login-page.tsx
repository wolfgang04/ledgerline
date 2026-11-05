"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  LoaderCircle,
  CheckCheck,
  Layers3,
  Wallet,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import { useLoginMutation, useSignupMutation } from "../queries";
import { useSession } from "../session-provider";
export function LoginPage({ onNotice }: { onNotice: Notify }) {
  const [mode, setMode] = useState("login");
  const [failure, setFailure] = useState<string | null>(null);
  const login = useLoginMutation();
  const signup = useSignupMutation();
  const { signIn } = useSession();
  const isPending = login.isPending || signup.isPending;
  const onError = (error: unknown) => setFailure(getApiError(error));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      email: String(data.get("email")),
      password: String(data.get("password")),
    };
    if (mode === "login") login.mutate(payload, { onSuccess: signIn, onError });
    else
      signup.mutate(
        {
          ...payload,
          first_name: String(data.get("first_name")),
          last_name: String(data.get("last_name")),
        },
        {
          onSuccess: () => {
            setMode("login");
            onNotice({
              type: "success",
              text: "Account created. Sign in to continue.",
            });
          },
          onError,
        },
      );
  }
  return (
    <main className="min-h-svh bg-card lg:grid lg:grid-cols-2">
      <section className="flex flex-col bg-sidebar p-6 text-sidebar-foreground sm:p-10 lg:order-2 lg:min-h-svh lg:p-12 xl:p-16">
        <Brand inverse />
        <div className="my-auto hidden max-w-lg py-16 lg:block">
          <h1 className="text-[2.75rem] font-semibold leading-[1.15] tracking-tight">
            Every allocation.
            <br />
            Every decision.
            <br />
            <span className="text-sidebar-primary">In clear view.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-sidebar-muted">
            Bring annual plans and spending authorizations into one shared
            financial workspace.
          </p>
          <ul className="mt-10 divide-y divide-sidebar-border">
            {(
              [
                [
                  "Plan with purpose",
                  "Set annual allocations and department spending plans.",
                  Layers3,
                ],
                [
                  "Authorize with confidence",
                  "Review requests against available department funds.",
                  Wallet,
                ],
                [
                  "Keep the decision record",
                  "Trace approvals, allocations, and changes to their source.",
                  CheckCheck,
                ],
              ] as const
            ).map(([title, description, Icon]) => (
              <li key={String(title)} className="flex gap-4 py-5">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-sidebar-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-sidebar-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-xs text-sidebar-muted lg:block">
          Ledgerline · Financial operations
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:order-1 lg:py-16">
        <div className="w-full max-w-[25rem]">
          <div className="mb-8">
            <h2 className="text-[1.75rem] font-semibold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {mode === "login"
                ? "Sign in to your financial workspace."
                : "Start a workspace or join your team's organization."}
            </p>
          </div>
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value);
              setFailure(null);
            }}
          >
            <TabsList className="mb-7 w-full border border-border bg-secondary/60">
              <TabsTrigger value="login" disabled={isPending}>
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" disabled={isPending}>
                Create account
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    autoComplete="given-name"
                    placeholder="Alex"
                    required
                    maxLength={256}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    autoComplete="family-name"
                    placeholder="Morgan"
                    required
                    maxLength={256}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "signup" ? 8 : undefined}
                placeholder="Enter your password"
                required
                aria-describedby={
                  mode === "signup" ? "password-hint" : undefined
                }
              />
              {mode === "signup" && (
                <p id="password-hint" className="text-xs text-muted-foreground">
                  Use at least 8 characters.
                </p>
              )}
            </div>
            {failure && (
              <Alert variant="destructive" role="alert">
                {failure}
              </Alert>
            )}
            <Button
              type="submit"
              className="h-11 w-full justify-between"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  {mode === "login"
                    ? "Sign in to Ledgerline"
                    : "Create your account"}
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <p className="mt-8 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
            After creating an account, you can start an organization or accept
            an invitation from your team.
          </p>
        </div>
      </section>
    </main>
  );
}
