"use client";
import Link from "next/link";
import type { FormEvent } from "react";
import {
  ArrowUpRight,
  Building2,
  Mail,
  Plus,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Metrics } from "@/components/metrics";
import { PageHeading } from "@/components/page-heading";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QueryState } from "@/components/query-state";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import {
  useAcceptInvitationMutation,
  useMyInvitationsQuery,
} from "@/features/organizations/invitation-queries";
import {
  useCreateOrganizationMutation,
  useOrganizationsQuery,
} from "@/features/organizations/queries";
export function Dashboard({ onNotice }: { onNotice: Notify }) {
  const organizations = useOrganizationsQuery();
  const invitations = useMyInvitationsQuery();
  const create = useCreateOrganizationMutation();
  const accept = useAcceptInvitationMutation();
  const onError = (error: unknown) =>
    onNotice({ type: "error", text: getApiError(error) });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    create.mutate(String(new FormData(form).get("name")), {
      onSuccess: ({ organization }) => {
        form.reset();
        onNotice({
          type: "success",
          text: `${organization.name} is ready. You are its administrator.`,
        });
      },
      onError,
    });
  }
  return (
    <DashboardShell title="Overview">
      <PageHeading
        eyebrow="Your financial workspace"
        title="A little clarity goes a long way."
        description="Bring the right people together. Choose a workspace, respond to an invitation, or start something new."
      />
      <Metrics
        items={[
          {
            label: "Your organizations",
            value: organizations.data?.organizations.length ?? "--",
            icon: Building2,
          },
          {
            label: "Pending invitations",
            value: invitations.data?.invitations.length ?? "--",
            icon: Mail,
          },
          {
            label: "Workspaces you manage",
            value:
              organizations.data?.organizations.filter(
                (item) => item.role === "organization_admin",
              ).length ?? "--",
            icon: ShieldCheck,
          },
        ]}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Your organizations</CardTitle>
            <CardDescription>
              A home for each team and its work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueryState
              loading={organizations.isLoading}
              error={organizations.error}
              empty={
                !organizations.data?.organizations.length
                  ? "No organizations yet. Create your first workspace."
                  : undefined
              }
            >
              <div className="space-y-2">
                {organizations.data?.organizations.map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/organizations/${organization.id}`}
                    className="group flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                      <Building2 className="size-5" />
                    </span>
                    <span className="min-w-32 flex-1 break-words font-medium">
                      {organization.name}
                    </span>
                    <Badge>
                      {organization.role?.replaceAll("_", " ") ?? "member"}
                    </Badge>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </QueryState>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-accent/40">
          <CardHeader>
            <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            <CardTitle>Start a workspace</CardTitle>
            <CardDescription>
              You become its initial administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization-name">Organization name</Label>
                <Input
                  id="organization-name"
                  name="name"
                  required
                  maxLength={255}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={create.isPending}
              >
                {create.isPending ? "Creating..." : "Create organization"}
                <ArrowUpRight />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Pending invitations to join other organizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueryState
            loading={invitations.isLoading}
            error={invitations.error}
            empty={
              !invitations.data?.invitations.length
                ? "No pending invitations."
                : undefined
            }
          >
            <div className="divide-y">
              {invitations.data?.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-wrap items-center gap-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">
                      {invitation.organization_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invitation.role.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Button
                    disabled={accept.isPending}
                    onClick={() =>
                      accept.mutate(invitation.id, {
                        onSuccess: () =>
                          onNotice({
                            type: "success",
                            text: `You joined ${invitation.organization_name}.`,
                          }),
                        onError,
                      })
                    }
                  >
                    {accept.isPending ? "Accepting..." : "Accept invitation"}
                  </Button>
                </div>
              ))}
            </div>
          </QueryState>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
