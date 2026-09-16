"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLoginMutation, useSignupMutation, type SignupInput } from "../hooks/queries/auth";
import { getApiError, type User } from "../lib/api";

type LoginPageProps = {
  onAuthenticated: (user: User) => void;
  notice: { type: "success" | "error"; text: string } | null;
  onNotice: (notice: { type: "success" | "error"; text: string }) => void;
};

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return <Label className="my-4">{label}<Input required name={name} type={type} placeholder={placeholder} /></Label>;
}

export function LoginPage({ onAuthenticated, notice, onNotice }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const login = useLoginMutation();
  const signup = useSignupMutation();
  const isPending = login.isPending || signup.isPending;
  const failure = (error: unknown) => onNotice({ type: "error", text: getApiError(error) });

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    if (mode === "login") {
      login.mutate(data as { email: string; password: string }, {
        onSuccess: (result) => {
          window.localStorage.setItem("financial-operations-token", result.token);
          window.localStorage.setItem("financial-operations-user", JSON.stringify(result.user));
          onAuthenticated(result.user);
          onNotice({ type: "success", text: "You are signed in. Your workspace is ready." });
        },
        onError: failure,
      });
    } else {
      signup.mutate(data as SignupInput, {
        onSuccess: () => {
          setMode("login");
          onNotice({ type: "success", text: "User created. Sign in to continue." });
        },
        onError: failure,
      });
    }
  }

  return <main className="shell login-shell">
    <header className="topbar"><div className="brand-mark">LO</div><div><strong>Ledgerline</strong><span>Finance operations</span></div></header>
    <section className="intro"><p className="eyebrow">People & access</p><h1>Make the organization<br /><em>move together.</em></h1><p className="lede">A focused workspace for creating teams, inviting collaborators, and keeping access exactly where it belongs.</p></section>
    {notice && <Alert variant={notice.type === "error" ? "destructive" : "default"}>{notice.text}</Alert>}
    <section className="auth-layout"><div className="side-note"><span className="number">01</span><h2>Start with the people who make the work happen.</h2><p>Create an account or sign in to open your organization workspace.</p></div><Card className="form-panel"><div className="tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create user</button></div><form onSubmit={submitAuth}>{mode === "signup" && <div className="two-fields"><Field label="First name" name="first_name" placeholder="Alex" /><Field label="Last name" name="last_name" placeholder="Morgan" /></div>}<Field label="Work email" name="email" type="email" placeholder="alex@company.com" /><Field label="Password" name="password" type="password" placeholder="••••••••" /><Button className="w-full" disabled={isPending}>{isPending ? "Working..." : mode === "login" ? "Open workspace" : "Create user"}<ArrowUpRight size={17} /></Button></form></Card></section>
    <footer><span>LEDGERLINE / 2026</span><span>Secure financial operations</span></footer>
  </main>;
}
