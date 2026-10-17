"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  LayoutGrid,
  LogOut,
  Menu,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { useSession } from "@/features/auth/session-provider";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

type ShellProps = {
  title: string;
  organizationId?: number;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  organizationId,
  children,
}: ShellProps) {
  const { user, signOut } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const platform = user?.role === "platform_admin" && !organizationId;
  const organizations = useOrganizationsQuery(!platform);
  const organization = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  );
  const membershipRole = organization?.role;
  const links = [
    {
      href: "/",
      label: platform ? "Platform overview" : "Overview",
      icon: LayoutGrid,
    },
    ...(organizationId
      ? [
          {
            href: `/organizations/${organizationId}`,
            label: "People & teams",
            icon: Building2,
          },
        ]
      : []),
  ];
  const navigation = (mobile = false) => (
    <>
      <Link
        href="/"
        className="px-6 pb-7 pt-7 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Brand inverse />
      </Link>
      {!platform && (
        <div className="px-4 pb-6">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
            Workspace
          </p>
          <Select
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
              router.push(
                value === "overview" ? "/" : `/organizations/${value}`,
              );
              setMobileOpen(false);
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
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
          {platform ? "Administration" : "Your workspace"}
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = organizationId ? href !== "/" : href === "/";
          const link = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-sidebar-muted transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-[current=page]:border-sidebar-border aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
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
      <div className="mx-4 my-6 rounded-xl border border-sidebar-border bg-sidebar-accent/35 p-4">
        <ShieldCheck className="mb-3 size-5 text-sidebar-primary" />
        <p className="text-sm font-medium">A clearer way forward.</p>
        <p className="mt-1 text-xs leading-relaxed text-sidebar-muted">
          Your people and workspaces, connected.
        </p>
      </div>
      <div className="border-t border-sidebar-border p-4">
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
          onClick={signOut}
        >
          <LogOut />
          Sign out
          <ArrowUpRight className="ml-auto size-3.5" />
        </Button>
      </div>
    </>
  );
  return (
    <div className="min-h-svh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-svh flex-col overflow-y-auto bg-sidebar text-sidebar-foreground md:flex">
        {navigation()}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-20 items-center gap-3 border-b bg-card/90 px-4 sm:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex flex-col gap-0 border-sidebar-border bg-sidebar text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-muted"
            >
              <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate your workspace or sign out.
              </SheetDescription>
              {navigation(true)}
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span>{platform ? "Platform" : "Workspace"}</span>
              <ChevronRight className="size-3" />
              <span className="truncate">
                {organizationId ? "Organization" : "Home"}
              </span>
            </p>
            <h1 className="truncate text-sm font-semibold sm:text-base">
              {title}
            </h1>
          </div>
          <Badge variant={platform ? "info" : "primary"}>
            {platform
              ? "Platform admin"
              : organizationId
                ? (membershipRole?.replaceAll("_", " ") ??
                  "Organization workspace")
                : "Personal workspace"}
          </Badge>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl flex-1 space-y-7 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
        <footer className="mx-4 flex flex-wrap justify-between gap-2 border-t py-5 text-[11px] text-muted-foreground sm:mx-8">
          <span>Ledgerline / Financial operations</span>
          <span>Make room for better decisions.</span>
        </footer>
      </div>
    </div>
  );
}
