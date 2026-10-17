"use client";
import { useSession } from "@/features/auth/session-provider";
import { LoginPage } from "@/features/auth/components/login-page";
import { Dashboard } from "@/features/organizations/components/dashboard";
import { PlatformDashboard } from "@/features/platform/components/platform-dashboard";
import { NoticeMessage, useNotice } from "@/components/notice";
import { QueryState } from "@/components/query-state";
export default function Home() {
  const { user, ready } = useSession();
  const { notice, notify, dismiss } = useNotice();
  if (!ready) return <QueryState loading />;
  return (
    <>
      {!user ? (
        <LoginPage onNotice={notify} />
      ) : user.role === "platform_admin" ? (
        <PlatformDashboard />
      ) : (
        <Dashboard onNotice={notify} />
      )}
      <NoticeMessage notice={notice} dismiss={dismiss} />
    </>
  );
}
