import { FolderOpen, LoaderCircle } from "lucide-react";
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
      <div
        role="status"
        className="flex items-center justify-center gap-3 rounded-xl bg-muted/50 p-8 text-sm text-muted-foreground"
      >
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Loading...
      </div>
    );
  if (error) return <Alert variant="destructive">{getApiError(error)}</Alert>;
  if (empty)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-background/70 px-5 py-10 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
          <FolderOpen className="size-5" aria-hidden="true" />
        </span>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {empty}
        </p>
      </div>
    );
  return children;
}
