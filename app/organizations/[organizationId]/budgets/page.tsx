"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session-provider";
import { BudgetWorkspace } from "@/features/budgets/budget-workspace";
import { NoticeMessage, useNotice } from "@/components/notice";
import { QueryState } from "@/components/query-state";

export default function BudgetsPage() {
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
      <BudgetWorkspace
        key={organizationId}
        organizationId={organizationId}
        onNotice={notify}
      />
      <NoticeMessage notice={notice} dismiss={dismiss} />
    </>
  );
}
