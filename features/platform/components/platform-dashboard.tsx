"use client";
import { useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Metrics } from "@/components/metrics";
import { QueryState } from "@/components/query-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  usePlatformOverviewQuery,
  usePlatformUsersQuery,
  usePlatformOrganizationsQuery,
} from "../queries";
export function PlatformDashboard() {
  const [userSearch, setUserSearch] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const overview = usePlatformOverviewQuery();
  const users = usePlatformUsersQuery(userSearch);
  const organizations = usePlatformOrganizationsQuery(organizationSearch);
  return (
    <DashboardShell title="Platform administration">
      <PageHeading
        title="Platform administration"
        description="A clear view of the people and organizations on Ledgerline. Platform access remains separate from organization permissions."
      />
      <QueryState loading={overview.isLoading} error={overview.error}>
        <Metrics
          items={[
            { label: "Users", value: overview.data?.metrics.users ?? "--" },
            {
              label: "Organizations",
              value: overview.data?.metrics.organizations ?? "--",
            },
            {
              label: "Memberships",
              value: overview.data?.metrics.memberships ?? "--",
            },
          ]}
        />
      </QueryState>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              aria-label="Search users by name or email"
              placeholder="Search by name or email"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Up to 25 results</p>
            <QueryState
              loading={users.isLoading}
              error={users.error}
              empty={!users.data?.users.length ? "No users found." : undefined}
            >
              <div className="divide-y">
                {users.data?.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="break-all text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge>{user.role.replaceAll("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </QueryState>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              aria-label="Search organizations by name"
              placeholder="Search by organization name"
              value={organizationSearch}
              onChange={(event) => setOrganizationSearch(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Up to 25 results</p>
            <QueryState
              loading={organizations.isLoading}
              error={organizations.error}
              empty={
                !organizations.data?.organizations.length
                  ? "No organizations found."
                  : undefined
              }
            >
              <div className="divide-y">
                {organizations.data?.organizations.map((organization) => (
                  <div key={organization.id} className="py-3">
                    <p className="break-words font-medium">
                      {organization.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Organization ID {organization.id}
                    </p>
                  </div>
                ))}
              </div>
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
