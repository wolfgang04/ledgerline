"use client";
import { Suspense, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UnsavedChangesProvider } from "@/components/unsaved-changes";
import { QueryState } from "@/components/query-state";
import { useSession } from "@/features/auth/session-provider";
import { useOrganizationsQuery } from "@/features/organizations/queries";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId: rawId } = useParams<{ organizationId: string }>();
  const organizationId = Number(rawId);
  const { user, ready } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const organizations = useOrganizationsQuery(
    !!user && user.role !== "platform_admin",
  );
  const organization = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  );
  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);
  if (!ready || !user) return <QueryState loading />;
  if (!Number.isSafeInteger(organizationId) || organizationId <= 0)
    return <QueryState empty="Invalid organization." />;
  const destination = pathname.endsWith("/overview")
    ? "Overview"
    : pathname.endsWith("/spending")
      ? "Spending & allocations"
      : pathname.endsWith("/financial-settings")
        ? "Financial settings"
        : pathname.endsWith("/budgets")
          ? "Budget planning"
          : "People & teams";
  return (
    <UnsavedChangesProvider key={organizationId}>
      <DashboardShell
        organizationId={organizationId}
        title={`${organization?.name ?? "Organization"} · ${destination}`}
      >
        <QueryState
          loading={organizations.isLoading}
          error={organizations.error}
          retry={() => void organizations.refetch()}
          empty={
            !organization
              ? "Organization not found or access unavailable."
              : undefined
          }
        >
          <Suspense fallback={<QueryState loading />}>{children}</Suspense>
        </QueryState>
      </DashboardShell>
    </UnsavedChangesProvider>
  );
}
