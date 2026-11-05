"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLeaveConfirmation } from "@/components/unsaved-changes";
import {
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSession } from "@/features/auth/session-provider";
import { useOrganizationsQuery } from "@/features/organizations/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkspaceNavigation } from "./workspace-navigation";

function subscribeNavigation(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ledgerline-navigation", callback);
  window.addEventListener("resize", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ledgerline-navigation", callback);
    window.removeEventListener("resize", callback);
  };
}
function navigationPreference() {
  try {
    return (
      localStorage.getItem("ledgerline-navigation") ??
      (window.innerWidth < 1024 ? "collapsed" : "expanded")
    );
  } catch {
    return window.innerWidth < 1024 ? "collapsed" : "expanded";
  }
}

export function DashboardShell({
  title,
  organizationId,
  children,
}: {
  title: string;
  organizationId?: number;
  children: React.ReactNode;
}) {
  const { user } = useSession();
  const leave = useLeaveConfirmation();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const preference = useSyncExternalStore(
    subscribeNavigation,
    navigationPreference,
    () => "expanded",
  );
  const collapsed = preference === "collapsed";
  const platform = user?.role === "platform_admin" && !organizationId;
  const organizations = useOrganizationsQuery(!platform);
  const role = organizations.data?.organizations.find(
    (item) => item.id === organizationId,
  )?.role;
  return (
    <div
      className={`min-h-svh md:grid ${collapsed ? "md:grid-cols-[4rem_minmax(0,1fr)]" : "md:grid-cols-[15rem_minmax(0,1fr)]"}`}
    >
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside
        className="sticky top-0 hidden h-svh flex-col overflow-y-auto bg-sidebar text-sidebar-foreground md:flex"
        aria-label="Main navigation"
      >
        <WorkspaceNavigation
          organizationId={organizationId}
          platform={platform}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-16 items-center gap-3 border-b bg-card px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:inline-flex"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            onClick={() => {
              try {
                localStorage.setItem(
                  "ledgerline-navigation",
                  collapsed ? "expanded" : "collapsed",
                );
              } catch {
                return;
              }
              window.dispatchEvent(new Event("ledgerline-navigation"));
            }}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
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
              className="flex flex-col gap-0 overflow-y-auto border-sidebar-border bg-sidebar text-sidebar-foreground [&_[data-slot=sheet-close]]:text-sidebar-muted"
            >
              <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate your workspace or sign out.
              </SheetDescription>
              <WorkspaceNavigation
                organizationId={organizationId}
                platform={platform}
                mobile
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <Link
              href="/"
              onNavigate={(event) => {
                if (leave.blocked) {
                  event.preventDefault();
                  leave.request(() => router.push("/"));
                }
              }}
              className="hidden shrink-0 text-muted-foreground hover:text-primary sm:block"
            >
              {platform ? "Platform" : "Workspaces"}
            </Link>
            <ChevronRight
              className="hidden size-3 shrink-0 text-muted-foreground sm:block"
              aria-hidden="true"
            />
            <span className="truncate font-medium">{title}</span>
          </div>
          <Badge variant="default" className="shrink-0 capitalize">
            {platform
              ? "Platform admin"
              : organizationId
                ? (role?.replaceAll("_", " ") ?? "Member")
                : "Personal"}
          </Badge>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[100rem] flex-1 space-y-6 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
