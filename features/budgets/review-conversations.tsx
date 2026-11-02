import { useState, type FormEvent } from "react";
import { useReviewThread } from "./use-review-thread";
import { ReviewMessageItem } from "./review-message";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ChangeHistory } from "./change-history";
import type { ProposalDetail, ReviewMessage } from "./types";

type MessageInput = {
  revision_number: number;
  department_id: number | null;
  kind: ReviewMessage["kind"];
  message: string;
  request_id?: number;
  updated_at?: string;
};

export function ReviewConversations({
  detail,
  manager,
  userId,
  readOnly,
  pending,
  onMessage,
  onRefresh,
  refreshError,
  refreshing,
}: {
  detail: ProposalDetail;
  manager: boolean;
  userId: number;
  readOnly: boolean;
  pending: boolean;
  onMessage: (message: MessageInput) => Promise<void>;
  onRefresh: () => void;
  refreshError?: string;
  refreshing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState(
    detail.department_id === null ? "company" : String(detail.department_id),
  );
  const [round, setRound] = useState(String(detail.plan.revision_number));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const departmentId = scope === "company" ? null : Number(scope);
  const currentRound = Number(round) === detail.plan.revision_number;
  const canPost =
    !readOnly &&
    currentRound &&
    ["under_review", "changes_requested", "revising"].includes(
      detail.plan.status,
    );
  const {
    thread,
    unread,
    count,
    timeline,
    incoming,
    atBottom,
    setViewport,
    resetThread,
    onScroll,
    scrollToBottom,
  } = useReviewThread(detail, userId, departmentId, round, open);

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const kind =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "request_changes"
        ? "request_changes"
        : "comment";
    await onMessage({
      revision_number: detail.plan.revision_number,
      department_id: departmentId,
      kind,
      message: drafts[thread] ?? "",
    });
    setDrafts((previous) => ({ ...previous, [thread]: "" }));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          resetThread();
          onRefresh();
        }
      }}
    >
      <SheetTrigger render={<Button type="button" variant="outline" />}>
        <MessageSquare className="size-4" />
        Conversations
        {unread.length > 0 && (
          <Badge
            variant="primary"
            aria-label={`${unread.length} unread messages`}
          >
            {unread.length}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>Proposal conversations</SheetTitle>
          <SheetDescription>
            {detail.plan.name} Â· Messages and review decisions are permanent.
          </SheetDescription>
        </SheetHeader>
        <div className="shrink-0 space-y-3 border-b p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Label id="conversation-scope">Conversation</Label>
              <Select
                value={scope}
                onValueChange={(value) => {
                  if (value) {
                    setScope(value);
                    resetThread(
                      value === "company" ? null : Number(value),
                      Number(round),
                    );
                  }
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-labelledby="conversation-scope"
                >
                  <SelectValue>
                    {scope === "company"
                      ? "Company proposal"
                      : (detail.working.allocations.find(
                          (allocation) =>
                            allocation.department_id === departmentId,
                        )?.name ?? "Department")}
                    {count(departmentId) > 0
                      ? ` (${count(departmentId)} unread)`
                      : ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {detail.department_id === null && (
                    <SelectItem value="company">
                      Company proposal
                      {count(null) > 0 ? ` (${count(null)} unread)` : ""}
                    </SelectItem>
                  )}
                  {detail.working.allocations.map((allocation) => (
                    <SelectItem
                      key={allocation.department_id}
                      value={String(allocation.department_id)}
                    >
                      {allocation.name}
                      {count(allocation.department_id) > 0
                        ? ` (${count(allocation.department_id)} unread)`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label id="conversation-round">Review round</Label>
              <Select
                value={round}
                onValueChange={(value) => {
                  if (value) {
                    setRound(value);
                    resetThread(departmentId, Number(value));
                  }
                }}
              >
                <SelectTrigger aria-labelledby="conversation-round">
                  <SelectValue>
                    Version {round}
                    {count(departmentId, Number(round)) > 0
                      ? ` (${count(departmentId, Number(round))} unread)`
                      : ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {detail.revisions.map((revision) => (
                    <SelectItem
                      key={revision.id}
                      value={String(revision.revision_number)}
                    >
                      Version {revision.revision_number}
                      {count(departmentId, revision.revision_number) > 0
                        ? ` (${count(departmentId, revision.revision_number)} unread)`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {scope === "company"
              ? "Visible to finance, company managers, and administrators."
              : "Visible to this department's managers, finance, company managers, and administrators."}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={refreshing}
            onClick={onRefresh}
          >
            {refreshing ? "Refreshingâ€¦" : "Refresh messages"}
          </Button>
          {refreshError && <Alert variant="destructive">{refreshError}</Alert>}
        </div>
        <div
          ref={setViewport}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          onScroll={onScroll}
        >
          {!timeline.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages in this conversation yet.
            </p>
          )}
          <ol className="space-y-4" aria-label="Conversation messages">
            {timeline.map((entry) => {
              if (entry.type === "edit")
                return (
                  <li key={`edit-${entry.edit.id}`}>
                    <ChangeHistory detail={detail} edit={entry.edit} />
                  </li>
                );
              return (
                <ReviewMessageItem
                  key={entry.message.id}
                  message={entry.message}
                  userId={userId}
                  currentRound={currentRound}
                />
              );
            })}
          </ol>
        </div>
        {!atBottom && incoming > 0 && (
          <Button
            type="button"
            variant="outline"
            className="mx-auto my-2 shrink-0"
            onClick={scrollToBottom}
          >
            New messages ({incoming}) â†“
          </Button>
        )}
        {canPost ? (
          <form
            onSubmit={(event) => void post(event).catch(() => {})}
            className="shrink-0 space-y-3 border-t bg-card p-4"
          >
            <Label htmlFor="review-message">Message</Label>
            <textarea
              id="review-message"
              name="message"
              required
              maxLength={1000}
              rows={3}
              className="w-full resize-none rounded-lg border bg-card p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              disabled={pending}
              value={drafts[thread] ?? ""}
              onChange={(event) =>
                setDrafts((previous) => ({
                  ...previous,
                  [thread]: event.target.value,
                }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" value="comment" disabled={pending}>
                <Send className="size-4" />
                Send message
              </Button>
              {manager && (
                <Button
                  type="submit"
                  value="request_changes"
                  variant="outline"
                  disabled={pending}
                >
                  Request changes
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="shrink-0 border-t p-4 text-sm text-muted-foreground">
            {readOnly
              ? "You have read-only conversation access."
              : "This review round is read-only. Select the latest version to continue the conversation."}
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
