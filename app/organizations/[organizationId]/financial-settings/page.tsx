"use client";
import { useParams } from "next/navigation";
import { NoticeMessage, useNotice } from "@/components/notice";
import { FinancialSettings } from "@/features/budgets/financial-settings";
export default function FinancialSettingsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { notice, notify, dismiss } = useNotice();
  return (
    <>
      <FinancialSettings
        organizationId={Number(organizationId)}
        onNotice={notify}
      />
      <NoticeMessage notice={notice} dismiss={dismiss} />
    </>
  );
}
