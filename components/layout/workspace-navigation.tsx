"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChartNoAxesCombined,
  LayoutGrid,
  LogOut,
  Settings2,
  Wallet,
  Users,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export function WorkspaceNavigation({
  organizationId,
  platform,
  mobile = false,
  collapsed = false,
  onNavigate,
}: {
  organizationId?: number;
  platform: boolean;
  mobile?: boolean;
  collapsed?: boolean;
  onNavigate: () => void;
}) {
  const { user, signOut } = useSession();
  const router = useRouter();
  const leave = useLeaveConfirmation();
  const pathname = usePathname();
  const organizations = useOrganizationsQuery(!platform);
  const membership = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  );
  const role = membership?.role;
  const finance = role === "finance";
  const manager = role === "manager";
  const department = !!membership?.department_id;
  const base = `/organizations/${organizationId}`;
  const links = [
    {
      href: "/",
      label: platform ? "Platform overview" : "All workspaces",
      icon: LayoutGrid,
    },
    ...(organizationId
      ? [
          ...(finance || (manager && department)
            ? [
                {
                  href: `${base}/overview`,
                  label: "Overview",
                  icon: ChartNoAxesCombined,
                },
              ]
            : []),
          ...(finance || manager || role === "organization_admin"
            ? [
                {
                  href: `${base}/budgets`,
                  label: "Budget planning",
                  icon: Wallet,
                },
              ]
            : []),
          ...(finance || (department && (manager || role === "employee"))
            ? [
                {
                  href: `${base}/spending`,
                  label: "Spending & allocations",
                  icon: Wallet,
                },
              ]
            : []),
          { href: base, label: "People & teams", icon: Users },
          ...(finance || manager || role === "organization_admin"
            ? [
                {
                  href: `${base}/financial-settings`,
                  label: "Financial settings",
                  icon: Settings2,
                },
              ]
            : []),
        ]
      : []),
  ];
  const navigate = (href: string) => {
    router.push(href);
    onNavigate();
  };
  return (
    <>
      <Link
        href="/"
        aria-label="Ledgerline workspaces"
        title={collapsed ? "Ledgerline" : undefined}
        onNavigate={(event) => {
          if (leave.blocked) {
            event.preventDefault();
            leave.request(() => navigate("/"));
          }
        }}
        className={cn(
          "flex h-20 shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          collapsed ? "justify-center" : "px-5",
        )}
      >
        <Brand inverse compact={collapsed} />
      </Link>
      {!platform && (
        <div className={cn("pb-6", collapsed ? "px-2" : "px-4")}>
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
              leave.request(() =>
                navigate(next ? organizationHref(next) : "/"),
              );
            }}
          >
            <SelectTrigger
              aria-label="Switch organization"
              title={membership?.name ?? "All workspaces"}
              className={cn(
                "h-11 w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-sidebar-ring/50",
                collapsed && "justify-center px-0 [&>svg:last-child]:hidden",
              )}
            >
              <Building2 className="size-4 shrink-0 text-sidebar-primary" />
              <SelectValue
                className={
                  collapsed ? "sr-only" : "min-w-0 flex-1 truncate text-left"
                }
              />
            </SelectTrigger>
            <SelectContent className="min-w-56 max-w-[calc(100vw-2rem)]">
              <SelectItem value="overview">All workspaces</SelectItem>
              {organizations.data?.organizations.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {organizations.isError && !collapsed && (
            <p className="mt-2 text-xs text-sidebar-muted">
              Workspace list unavailable. Return to all workspaces to retry.
            </p>
          )}
        </div>
      )}
      <nav
        aria-label="Workspace"
        className={cn("flex-1 space-y-1", collapsed ? "px-2" : "px-3")}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const link = (
            <Link
              href={href}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              onNavigate={(event) => {
                if (leave.blocked) {
                  event.preventDefault();
                  if (!active) leave.request(() => navigate(href));
                } else onNavigate();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-muted outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-primary",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
          return mobile ? (
            <SheetClose key={href} render={link} />
          ) : (
            <div key={href}>{link}</div>
          );
        })}
      </nav>
      <div
        className={cn(
          "mt-8 border-t border-sidebar-border",
          collapsed ? "p-2" : "p-4",
        )}
      >
        <div
          className={cn(
            "mb-3 flex min-w-0 items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <span
            title={user?.name}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sm font-semibold text-sidebar-primary"
          >
            {user?.name.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-muted">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          disabled={leave.pending}
          onClick={() => leave.request(signOut)}
        >
          <LogOut />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </>
  );
}
