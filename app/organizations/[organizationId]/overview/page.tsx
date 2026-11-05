"use client";
import { useParams } from "next/navigation";
import { FinancialOverview } from "@/features/budgets/financial-overview";
export default function OverviewPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <FinancialOverview organizationId={Number(organizationId)} />;
}
