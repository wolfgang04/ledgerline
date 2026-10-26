import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
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
import { formatBudgetTimestamp, conversationEdits } from "@/lib/budget";
import { ChangeHistory } from "./change-history";
import {
  conversationReadKey,
  markMessagesRead,
  parseReadIds,
  readSnapshot,
  subscribeConversationReads,
  unreadMessages,
} from "@/lib/conversations";
import { AllocationSummary } from "./allocation-summary";
import type { ProposalDetail, ReviewMessage } from "./queries";

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
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [openedMaxId, setOpenedMaxId] = useState(0);
  const nearBottom = useRef(true);
  const openedThread = useRef("");
  const departmentId = scope === "company" ? null : Number(scope);
  const currentRound = Number(round) === detail.plan.revision_number;
  const canPost =
    !readOnly &&
    currentRound &&
    ["under_review", "changes_requested", "revising"].includes(
      detail.plan.status,
    );
  const keyFor = (department: number | null, version: number) =>
    conversationReadKey(
      userId,
      detail.plan.organization_id,
      detail.plan.id,
      department,
      version,
    );
  const thread = keyFor(departmentId, Number(round));
  const keys = [
    ...new Set(
      detail.messages.map((message) =>
        keyFor(message.department_id, message.revision_number),
      ),
    ),
  ];
  const snapshot = useSyncExternalStore(
    subscribeConversationReads,
    () =>
      JSON.stringify(
        Object.fromEntries(keys.map((key) => [key, readSnapshot(key)])),
      ),
    () => "{}",
  );
  const reads = JSON.parse(snapshot) as Record<string, string>;
  const unread = detail.messages.filter(
    (message) =>
      unreadMessages(
        [message],
        userId,
        parseReadIds(
          reads[keyFor(message.department_id, message.revision_number)] ?? null,
        ),
      ).length > 0,
  );
  const count = (department: number | null, version?: number) =>
    unread.filter(
      (message) =>
        message.department_id === department &&
        (version === undefined || message.revision_number === version),
    ).length;
  const messages = detail.messages.filter(
    (message) =>
      message.department_id === departmentId &&
      message.revision_number === Number(round),
  );
  const timeline = [
    ...messages.map((message) => ({
      type: "message" as const,
      message,
      at: message.created_at,
    })),
    ...conversationEdits(detail.audit, departmentId, Number(round)).map(
      (edit) => ({ type: "edit" as const, edit, at: edit.created_at }),
    ),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const incoming = unread.filter(
    (message) =>
      message.department_id === departmentId &&
      message.revision_number === Number(round) &&
      message.id > openedMaxId,
  ).length;

  useLayoutEffect(() => {
    if (!open || !viewport) return;
    if (openedThread.current !== thread) {
      openedThread.current = thread;
      nearBottom.current = true;
    }
    if (nearBottom.current) viewport.scrollTo({ top: viewport.scrollHeight });
  }, [open, viewport, thread, messages]);

  useEffect(() => {
    if (!open || !viewport) return;
    const observe = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (document.visibilityState !== "visible") return;
          markMessagesRead(
            thread,
            entries
              .filter((entry) => entry.isIntersecting)
              .map((entry) =>
                Number((entry.target as HTMLElement).dataset.messageId),
              ),
          );
        },
        { root: viewport, threshold: 0.01 },
      );
      viewport
        .querySelectorAll<HTMLElement>("[data-message-id]")
        .forEach((element) => {
          if (element.dataset.authorId !== String(userId))
            observer.observe(element);
        });
      return observer;
    };
    let observer = observe();
    const visibility = () => {
      observer.disconnect();
      if (document.visibilityState === "visible") observer = observe();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [open, viewport, thread, messages, userId]);

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
          openedThread.current = "";
          nearBottom.current = true;
          setOpenedMaxId(messages.at(-1)?.id ?? 0);
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
                    nearBottom.current = true;
                    setOpenedMaxId(
                      detail.messages
                        .filter(
                          (message) =>
                            message.department_id ===
                              (value === "company" ? null : Number(value)) &&
                            message.revision_number === Number(round),
                        )
                        .at(-1)?.id ?? 0,
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
                    nearBottom.current = true;
                    setOpenedMaxId(
                      detail.messages
                        .filter(
                          (message) =>
                            message.department_id === departmentId &&
                            message.revision_number === Number(value),
                        )
                        .at(-1)?.id ?? 0,
                    );
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
              : "Visible to this departmentâ€™s managers, finance, company managers, and administrators."}
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
          onScroll={() => {
            if (viewport) {
              const bottom =
                viewport.scrollHeight -
                  viewport.scrollTop -
                  viewport.clientHeight <
                48;
              nearBottom.current = bottom;
              setAtBottom(bottom);
            }
          }}
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
              const message = entry.message;
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
                        : (message.author_name ??
                          `Member ${message.created_by}`)}
                    </span>
                    <Badge>{message.kind.replaceAll("_", " ")}</Badge>
                    {message.request_id && (
                      <span>Request #{message.request_id}</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.description_comments}
                  </p>
                  {message.agreement_snapshot && (
                    <details>
                      <summary className="cursor-pointer text-xs">
                        Values confirmed in this agreement
                      </summary>
                      <AllocationSummary
                        snapshot={message.agreement_snapshot}
                      />
                    </details>
                  )}
                  {message.kind === "request_changes" && (
                    <p className="text-xs text-muted-foreground">
                      Request #{message.id}:{" "}
                      {currentRound
                        ? message.agreed
                          ? "Agreed on current values"
                          : "Awaiting agreement on current values"
                        : "Previous review round"}
                    </p>
                  )}
                  {message.kind === "request_changes" &&
                    canPost &&
                    manager &&
                    message.created_by === userId &&
                    !message.agreed &&
                    detail.plan.status === "changes_requested" && (
                      <div className="space-y-3 rounded-lg border bg-card p-3">
                        <p className="text-xs font-medium">
                          Current saved values for this agreement
                        </p>
                        <AllocationSummary
                          snapshot={
                            departmentId === null
                              ? detail.working
                              : {
                                  ...detail.working,
                                  description: null,
                                  proposed_amount: null,
                                  reserve: null,
                                  allocations:
                                    detail.working.allocations.filter(
                                      (allocation) =>
                                        allocation.department_id ===
                                        departmentId,
                                    ),
                                }
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto whitespace-normal text-left"
                          disabled={pending}
                          onClick={() =>
                            void onMessage({
                              revision_number: detail.plan.revision_number,
                              department_id: departmentId,
                              kind: "agreement",
                              request_id: message.id,
                              message:
                                "I agree to the current saved values for this scope.",
                              updated_at: detail.plan.updated_at,
                            }).catch(() => {})
                          }
                        >
                          Confirm agreement on saved working values
                        </Button>
                      </div>
                    )}
                  <time
                    className="block text-[11px] text-muted-foreground"
                    dateTime={message.created_at}
                  >
                    {formatBudgetTimestamp(message.created_at)}
                  </time>
                </li>
              );
            })}
          </ol>
        </div>
        {!atBottom && incoming > 0 && (
          <Button
            type="button"
            variant="outline"
            className="mx-auto my-2 shrink-0"
            onClick={() => {
              if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight });
                nearBottom.current = true;
                setAtBottom(true);
              }
            }}
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
