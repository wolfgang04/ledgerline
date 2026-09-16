"use client";

import { useState } from "react";
import { Alert } from "../../components/ui/alert";
import { OrganizationDashboard } from "../../components/organization-dashboard";
import { useRouter, useParams } from "next/navigation";
import type { User } from "../../lib/api";

export default function OrganizationPage() {
  const router = useRouter();
  const params = useParams<{ organizationId: string }>();
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = window.localStorage.getItem("financial-operations-user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });

  function signOut() {
    window.localStorage.removeItem("financial-operations-token");
    window.localStorage.removeItem("financial-operations-user");
    router.push("/");
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  return (
    <main className="shell dashboard-shell">
      <OrganizationDashboard
        user={user}
        organizationId={Number(params.organizationId)}
        onSignOut={signOut}
        onNotice={setNotice}
      />
      {notice && (
        <Alert variant={notice.type === "error" ? "destructive" : "default"}>
          {notice.text}
        </Alert>
      )}
    </main>
  );
}
