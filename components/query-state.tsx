import { FolderOpen } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { getApiError } from "@/lib/api";

export function QueryState({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  children?: React.ReactNode;
}) {
  if (loading)
    return (
      <div role="status" aria-label="Loading" className="space-y-3 py-6">
        <span className="sr-only">Loading…</span>
        <div
          aria-hidden="true"
          className="h-4 w-2/5 animate-pulse rounded bg-border"
        />
        <div
          aria-hidden="true"
          className="h-4 w-3/4 animate-pulse rounded bg-border/60"
        />
        <div
          aria-hidden="true"
          className="h-4 w-1/2 animate-pulse rounded bg-border/60"
        />
      </div>
    );
  if (error) return <Alert variant="destructive">{getApiError(error)}</Alert>;
  if (empty)
    return (
      <div className="flex items-start gap-3 py-6 text-sm text-muted-foreground">
        <FolderOpen className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p className="max-w-prose leading-relaxed">{empty}</p>
      </div>
    );
  return children;
}
