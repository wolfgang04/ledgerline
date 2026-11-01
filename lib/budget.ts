import type {
  ProposalAuditEvent,
  ReviewMessage,
  ProposalDetail,
} from "../features/budgets/queries";

export function latestProposalDetail(
  detail: ProposalDetail | undefined,
  conversation: ProposalDetail | undefined,
) {
  if (!detail) return conversation;
  if (!conversation) return detail;
  return new Date(detail.plan.updated_at).getTime() >
    new Date(conversation.plan.updated_at).getTime()
    ? detail
    : conversation;
}

export function proposalHistorySummary(
  audit: ProposalAuditEvent[],
  messages: ReviewMessage[] = [],
) {
  const actions = new Set([
    "edited",
    "revision_started",
    "resubmitted",
    "approved",
    "department_approved",
    "spending_plan_updated",
    "committed",
  ]);
  const changes = [
    ...audit
      .filter((event) => actions.has(event.action))
      .map((event) => ({ ...event, key: `audit-${event.id}` })),
    // Requests and agreements live in messages; status audit entries would count requests twice.
    ...messages
      .filter(
        (message) =>
          message.kind === "request_changes" || message.kind === "agreement",
      )
      .map((message) => ({
        id: message.id,
        key: `message-${message.id}`,
        action:
          message.kind === "agreement"
            ? "revision_agreed"
            : "revision_requested",
        created_at: message.created_at,
        author_name: message.author_name ?? `Member ${message.created_by}`,
        reason: message.description_comments,
        revision_number: message.revision_number,
        changes: [] as ProposalAuditEvent["changes"],
      })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
      b.created_at.localeCompare(a.created_at) ||
      b.id - a.id,
  );
  return { count: changes.length, latest: changes[0], events: changes };
}

export function conversationEdits(
  audit: ProposalAuditEvent[],
  departmentId: number | null,
  round: number,
) {
  return audit
    .filter((event) => event.action === "edited")
    .map((event) => {
      const submission = audit.find(
        (next) =>
          next.id > event.id &&
          ["submitted", "resubmitted"].includes(next.action),
      );
      return {
        ...event,
        conversationRound:
          submission?.revision_number ?? Math.max(1, event.revision_number),
        reason: departmentId === null ? event.reason : null,
        changes:
          departmentId === null
            ? event.changes
            : event.changes.filter(
                (change) => change.department_id === departmentId,
              ),
      };
    })
    .filter(
      (event) =>
        event.conversationRound === round &&
        (departmentId === null || event.changes.length > 0),
    );
}

export function formatBudgetTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatFinancialAmount(value: string | number) {
  const text = String(value);
  if (!/^-?\d+(\.\d+)?$/.test(text)) return text;
  const [whole, fraction] = text.split(".");
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction === undefined ? "" : `.${fraction}`)
  );
}

export function currencyLabel(currency: string) {
  const symbol =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  return symbol === currency ? currency : `${currency} ${symbol}`;
}

export function matchesCurrency(currency: string, query: string) {
  return currencyLabel(currency)
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function allocationTotals(total: string, amounts: string[]) {
  const minor = (value: string) => {
    if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value)) return null;
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  };
  const whole = minor(total);
  const parts = amounts.map(minor);
  if (whole === null || parts.some((value) => value === null)) return null;
  const allocated = parts.reduce<bigint>(
    (sum, value) => sum + value!,
    BigInt(0),
  );
  const remaining = whole - allocated;
  const format = (value: bigint) => {
    const absolute = value < BigInt(0) ? -value : value;
    return `${value < BigInt(0) ? "-" : ""}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, "0")}`;
  };
  return {
    allocated: format(allocated),
    reserve: format(remaining),
    overallocated: remaining < BigInt(0),
    percentages: parts.map((part) =>
      whole > BigInt(0)
        ? `${Number((part! * BigInt(10000)) / whole) / 100}%`
        : "0%",
    ),
  };
}
