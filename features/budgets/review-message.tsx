import { Badge } from "@/components/ui/badge";
import { formatBudgetTimestamp } from "@/lib/budget";
import { AllocationSummary } from "./allocation-summary";
import type { ReviewMessage } from "./types";

export function ReviewMessageItem({
  message,
  userId,
  currentRound,
}: {
  message: ReviewMessage;
  userId: number;
  currentRound: boolean;
}) {
  return (
    <li
      key={message.id}
      data-message-id={message.id}
      data-author-id={message.created_by}
      className={`w-fit max-w-[95%] space-y-2 rounded-2xl border p-3 ${message.created_by === userId ? "ml-auto rounded-br-sm border-primary/15 bg-accent" : "mr-auto rounded-bl-sm bg-muted/50"}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold">
          {message.created_by === userId
            ? "You"
            : (message.author_name ?? `Member ${message.created_by}`)}
        </span>
        <Badge>{message.kind.replaceAll("_", " ")}</Badge>
        {message.request_id && <span>Request #{message.request_id}</span>}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">
        {message.description_comments}
      </p>
      {message.agreement_snapshot && (
        <details>
          <summary className="cursor-pointer text-xs">
            Values confirmed in this agreement
          </summary>
          <AllocationSummary snapshot={message.agreement_snapshot} />
        </details>
      )}
      {message.kind === "request_changes" && (
        <p className="text-xs text-muted-foreground">
          Request #{message.id}:{" "}
          {currentRound
            ? message.agreed
              ? "Agreed on current values"
              : "Finance can address this in a new submission"
            : "Previous review round"}
        </p>
      )}
      <time
        className="block text-[11px] text-muted-foreground"
        dateTime={message.created_at}
      >
        {formatBudgetTimestamp(message.created_at)}
      </time>
    </li>
  );
}
