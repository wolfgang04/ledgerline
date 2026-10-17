"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Layers3,
  Users,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { Brand, LedgerlineMark } from "@/components/brand";
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
    <main className="min-h-svh lg:grid lg:grid-cols-[1fr_1fr]">
      <section className="relative flex flex-col overflow-hidden bg-sidebar px-6 py-7 text-sidebar-foreground sm:px-12 lg:min-h-svh lg:px-14 lg:py-10 xl:px-20">
        <Brand inverse />
        <div className="relative z-10 my-12 max-w-lg lg:my-auto lg:py-16">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-primary">
            <span className="size-1.5 rounded-full bg-sidebar-primary" />
            Clarity starts here
          </p>
          <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl xl:text-6xl">
            Good decisions.
            <br />
            <span className="text-sidebar-primary">Great foundations.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-sidebar-muted">
            Bring your people and workspaces together. Build a clearer picture
            of the way your organization works.
          </p>
          <div className="mt-10 hidden grid-cols-3 gap-5 border-t border-sidebar-border pt-6 sm:grid">
            {[
              { icon: Layers3, title: "One workspace", text: "Room to grow" },
              { icon: Users, title: "Your people", text: "Better together" },
              {
                icon: ShieldCheck,
                title: "Clear access",
                text: "Defined roles",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon
                  className="mb-3 size-5 text-sidebar-primary"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium">{title}</p>
                <p className="mt-1 text-[11px] text-sidebar-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 size-80 rotate-[-20deg] rounded-[4rem] border border-sidebar-primary/15 bg-sidebar-primary/5 p-12"
        >
          <div className="h-full rounded-[2rem] border border-sidebar-primary/20 bg-sidebar-primary/5" />
        </div>
        <p className="relative z-10 hidden text-[11px] text-sidebar-muted lg:block">
          Built for the people behind the numbers.
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <LedgerlineMark className="mb-6 text-primary" />
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Your next chapter
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              {mode === "login" ? "Welcome back." : "Make it your workspace."}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {mode === "login"
                ? "Sign in to pick up where you left off."
                : "Create an account, then start or join an organization."}
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
                  Working...
                </>
              ) : (
                <>
                  {mode === "login"
                    ? "Open your workspace"
                    : "Create your account"}
                  <ArrowRight />
                </>
              )}
            </Button>
          </form>
          <div className="mt-8 flex items-start gap-3 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
            <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              No workspace yet? Create your account and set up an organization.
              No platform approval needed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
