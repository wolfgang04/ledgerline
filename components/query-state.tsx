import { FolderOpen } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function QueryState({
  loading,
  error,
  empty,
  children,
  retry,
  action,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  children?: React.ReactNode;
  retry?: () => void;
  action?: React.ReactNode;
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
  if (error)
    return (
      <Alert variant="destructive">
        <p role="alert">{getApiError(error)}</p>
        {retry && (
          <Button variant="outline" className="mt-3" onClick={retry}>
            Retry
          </Button>
        )}
      </Alert>
    );
  if (empty)
    return (
      <div className="flex items-start gap-3 py-6 text-sm text-muted-foreground">
        <FolderOpen className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="space-y-3">
          <p className="max-w-prose leading-relaxed">{empty}</p>
          {action}
        </div>
      </div>
    );
  return children;
}
