"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session-provider";
import { OrganizationDashboard } from "@/features/organizations/components/organization-dashboard";
import { NoticeMessage, useNotice } from "@/components/notice";
import { QueryState } from "@/components/query-state";
export default function OrganizationPage() {
  const { user, ready } = useSession();
  const router = useRouter();
  const { organizationId: rawId } = useParams<{ organizationId: string }>();
  const organizationId = Number(rawId);
  const { notice, notify, dismiss } = useNotice();
  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);
  if (!ready || !user) return <QueryState loading />;
  if (!Number.isSafeInteger(organizationId) || organizationId <= 0)
    return <QueryState empty="Invalid organization." />;
  return (
    <>
      <OrganizationDashboard
        organizationId={organizationId}
        onNotice={notify}
      />
      <NoticeMessage notice={notice} dismiss={dismiss} />
    </>
  );
}
