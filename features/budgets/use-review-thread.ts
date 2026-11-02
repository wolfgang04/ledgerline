import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  conversationReadKey,
  markMessagesRead,
  parseReadIds,
  readSnapshot,
  subscribeConversationReads,
  unreadMessages,
} from "@/lib/conversations";
import { conversationEdits } from "@/lib/budget";
import type { ProposalDetail } from "./types";

export function useReviewThread(
  detail: ProposalDetail,
  userId: number,
  departmentId: number | null,
  round: string,
  open: boolean,
) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [openedMaxId, setOpenedMaxId] = useState(0);
  const nearBottom = useRef(true);
  const openedThread = useRef("");
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

  function resetThread(department = departmentId, version = Number(round)) {
    openedThread.current = "";
    nearBottom.current = true;
    setOpenedMaxId(
      detail.messages
        .filter(
          (message) =>
            message.department_id === department &&
            message.revision_number === version,
        )
        .at(-1)?.id ?? 0,
    );
  }
  function onScroll() {
    if (!viewport) return;
    const bottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48;
    nearBottom.current = bottom;
    setAtBottom(bottom);
  }
  function scrollToBottom() {
    viewport?.scrollTo({ top: viewport.scrollHeight });
    nearBottom.current = true;
    setAtBottom(true);
  }
  return {
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
  };
}
