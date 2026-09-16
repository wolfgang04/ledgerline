"use client";

import { useState } from "react";
import { Alert } from "./components/ui/alert";
import { Dashboard } from "./components/dashboard";
import { LoginPage } from "./components/login-page";
import { PlatformDashboard } from "./components/platform-dashboard";
import type { User } from "./lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = window.localStorage.getItem("financial-operations-user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function signOut() {
    window.localStorage.removeItem("financial-operations-token");
    window.localStorage.removeItem("financial-operations-user");
    setUser(null);
    setNotice({ type: "success", text: "Signed out." });
  }

  if (!user) {
    return <LoginPage onAuthenticated={setUser} notice={notice} onNotice={setNotice} />;
  }

  return <main className="shell dashboard-shell">
    {user.role === "platform_admin" ? <PlatformDashboard user={user} onSignOut={signOut} /> : <Dashboard user={user} onSignOut={signOut} onNotice={setNotice} />}
    {notice && <Alert variant={notice.type === "error" ? "destructive" : "default"}>{notice.text}</Alert>}
  </main>;
}
