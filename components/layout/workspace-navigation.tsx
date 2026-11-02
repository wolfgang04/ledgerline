"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutGrid, LogOut, Wallet } from "lucide-react";
import { useSession } from "@/features/auth/session-provider";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import { organizationHref } from "@/features/organizations/navigation";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetClose } from "@/components/ui/sheet";
import { useLeaveConfirmation } from "@/components/unsaved-changes";

export function WorkspaceNavigation({
  organizationId,
  platform,
  mobile = false,
  onNavigate,
}: {
  organizationId?: number;
  platform: boolean;
  mobile?: boolean;
  onNavigate: () => void;
}) {
  const { user, signOut } = useSession();
  const router = useRouter();
  const leave = useLeaveConfirmation();
  const pathname = usePathname();
  const organizations = useOrganizationsQuery(!platform);
  const membershipRole = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  )?.role;
  const links = [
    {
      href: "/",
      label: platform ? "Platform overview" : "All workspaces",
      icon: LayoutGrid,
    },
    ...(organizationId
      ? [
          {
            href: `/organizations/${organizationId}`,
            label: "People & teams",
            icon: Building2,
          },
          ...(membershipRole === "finance" ||
          membershipRole === "organization_admin" ||
          membershipRole === "manager"
            ? [
                {
                  href: `/organizations/${organizationId}/budgets`,
                  label: "Budgets",
                  icon: Wallet,
                },
              ]
            : []),
        ]
      : []),
  ];
  return (
    <>
      <Link
        href="/"
        onNavigate={(event) => {
          if (leave.blocked) {
            event.preventDefault();
            leave.request(() => router.push("/"));
          }
        }}
        className="px-5 pb-8 pt-7 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Brand inverse />
      </Link>
      {!platform && (
        <div className="px-4 pb-6">
          <p className="mb-2 px-2 text-xs font-medium text-sidebar-muted">
            Workspace
          </p>
          <Select
            disabled={leave.pending}
            value={String(organizationId ?? "overview")}
            items={{
              overview: "All workspaces",
              ...Object.fromEntries(
                (organizations.data?.organizations ?? []).map((item) => [
                  String(item.id),
                  item.name,
                ]),
              ),
            }}
            onValueChange={(value) => {
              if (value === null) return;
              const next = organizations.data?.organizations.find(
                (item) => String(item.id) === value,
              );
              leave.request(() => {
                router.push(next ? organizationHref(next) : "/");
                onNavigate();
              });
            }}
          >
            <SelectTrigger
              aria-label="Switch organization"
              className="h-11 w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-sidebar-ring/50"
            >
              <Building2 className="size-4 text-sidebar-primary" />
              <SelectValue className="flex-1 truncate text-left" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">All workspaces</SelectItem>
              {organizations.data?.organizations.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {organizations.isError && (
            <p className="mt-2 px-2 text-xs text-sidebar-muted">
              Workspace list unavailable. Return to overview to retry.
            </p>
          )}
        </div>
      )}
      <nav aria-label="Workspace" className="flex-1 space-y-1 px-4">
        <p className="mb-2 px-2 text-xs font-medium text-sidebar-muted">
          {platform ? "Administration" : "Workspace"}
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const link = (
            <Link
              href={href}
              onNavigate={(event) => {
                if (leave.blocked) {
                  event.preventDefault();
                  if (active) return;
                  leave.request(() => {
                    router.push(href);
                    onNavigate();
                  });
                }
              }}
              aria-current={active ? "page" : undefined}
              className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-sidebar-muted transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-[current=page]:border-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
              {active && (
                <span className="size-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
          return mobile ? (
            <SheetClose key={href} render={link} />
          ) : (
            <div key={href}>{link}</div>
          );
        })}
      </nav>
      <div className="mt-8 border-t border-sidebar-border p-4">
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-primary/15 text-sm font-semibold text-sidebar-primary">
            {user?.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring"
          disabled={leave.pending}
          onClick={() => leave.request(signOut)}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </>
  );
}
