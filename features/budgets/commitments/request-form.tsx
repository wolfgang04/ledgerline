"use client";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUnsavedEditor,
  useLeaveConfirmation,
} from "@/components/unsaved-changes";
import { getApiError } from "@/lib/api";
import type { Notify } from "@/components/notice";
import { QueryState } from "@/components/query-state";
import { useOrganizationMembersQuery } from "@/features/organizations/queries";
import { formatFinancialAmount } from "@/lib/budget";
import { useCommitmentMutation } from "./queries";
import type { RequestKind } from "./types";

export function RequestForm({
  organizationId,
  budgetId,
  kind,
  categories,
  currency,
  manager,
  allocation,
  onClose,
  onNotice,
}: {
  organizationId: number;
  budgetId: number;
  kind: RequestKind;
  categories: string[];
  currency: string;
  manager: boolean;
  allocation?: { department_id: number; available: string };
  onClose: () => void;
  onNotice: Notify;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [justification, setJustification] = useState("");
  const [category, setCategory] = useState("unplanned");
  const [recipientId, setRecipientId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [allocationKey] = useState(() => crypto.randomUUID());
  const members = useOrganizationMembersQuery(
    allocation ? organizationId : null,
  );
  const recipients =
    members.data?.members.filter(
      (member) =>
        member.role === "employee" &&
        member.department_id === allocation?.department_id,
    ) ?? [];
  const recipient = recipients.find(
    (member) => String(member.user_id) === recipientId,
  );
  const mutation = useCommitmentMutation(organizationId, budgetId);
  const leave = useLeaveConfirmation();
  useUnsavedEditor(
    !!(
      title ||
      amount ||
      justification ||
      category !== "unplanned" ||
      recipientId
    ),
    mutation.isPending,
  );
  const spending = kind === "spending";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (allocation && !confirming) {
      setConfirming(true);
      return;
    }
    const callbacks = {
      onSuccess: () => {
        onNotice({
          type: "success" as const,
          text: allocation
            ? "Spending allocated to member."
            : spending
              ? "Spending request submitted."
              : "Extra budget request submitted to Finance.",
        });
        onClose();
      },
    };
    if (allocation) {
      mutation.mutate(
        {
          kind: "allocation",
          values: {
            title,
            amount,
            justification,
            category:
              category === "unplanned" ? null : categories[Number(category)]!,
            allocated_to_user_id: Number(recipientId),
            idempotency_key: allocationKey,
          },
        },
        callbacks,
      );
      return;
    }
    mutation.mutate(
      {
        kind,
        values: {
          amount,
          justification,
          ...(spending
            ? {
                title,
                category:
                  category === "unplanned"
                    ? null
                    : categories[Number(category)],
              }
            : {}),
        },
      },
      callbacks,
    );
  }
  return (
    <section
      aria-labelledby="request-form-title"
      className="space-y-5 rounded-xl border bg-card p-5 sm:p-6"
    >
      <div className="space-y-2">
        <h2 id="request-form-title" className="text-xl font-semibold">
          {allocation
            ? "Allocate spending to member"
            : spending
              ? "Request spending"
              : "Request extra budget"}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          {allocation
            ? "Authorize specific spending for an employee in your department. The amount becomes committed immediately after confirmation."
            : spending
              ? `This request goes to ${manager ? "Finance" : "a department manager"}. It counts as committed spending only after approval.`
              : "Finance reviews this request against the organization reserve. Extra funding does not approve any spending requests."}
        </p>
      </div>
      <form onSubmit={submit} className="max-w-2xl space-y-5">
        <fieldset disabled={mutation.isPending} className="space-y-5">
          {confirming && allocation ? (
            <div
              className="space-y-4"
              aria-labelledby="allocation-confirmation-title"
            >
              <h3 id="allocation-confirmation-title" className="font-semibold">
                Confirm spending allocation
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Recipient</dt>
                  <dd className="break-words font-medium">
                    {recipient
                      ? `${recipient.first_name} ${recipient.last_name}`
                      : "Selected employee"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Purpose</dt>
                  <dd className="break-words">{title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatFinancialAmount(amount)} {currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>
                    {category === "unplanned"
                      ? "Unplanned"
                      : categories[Number(category)]}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Currently available</dt>
                  <dd className="tabular-nums">
                    {formatFinancialAmount(allocation.available)} {currency}
                  </dd>
                </div>
              </dl>
              <p className="text-sm leading-relaxed">
                Confirming immediately adds {formatFinancialAmount(amount)}{" "}
                {currency} to committed spending and reduces your department’s
                available funds by the same amount. The employee does not need
                to submit a request. This authorizes spending; it does not
                record a payment.
              </p>
            </div>
          ) : (
            <>
              {allocation && (
                <QueryState
                  loading={members.isLoading}
                  error={members.error}
                  empty={
                    members.data && !recipients.length
                      ? "No eligible employees in your department. An organization administrator must assign an employee before you can allocate spending."
                      : undefined
                  }
                >
                  <div className="space-y-2">
                    <Label htmlFor="allocation-recipient">
                      Department employee
                    </Label>
                    <Select
                      value={recipientId || null}
                      items={Object.fromEntries(
                        recipients.map((member) => [
                          String(member.user_id),
                          `${member.first_name} ${member.last_name}`,
                        ]),
                      )}
                      onValueChange={(value) =>
                        value !== null && setRecipientId(value)
                      }
                    >
                      <SelectTrigger
                        id="allocation-recipient"
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((member) => (
                          <SelectItem
                            key={member.user_id}
                            value={String(member.user_id)}
                          >
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </QueryState>
              )}
              {spending && (
                <div className="space-y-2">
                  <Label htmlFor="spending-title">What do you need?</Label>
                  <Input
                    id="spending-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={255}
                    placeholder="Equipment for the engineering team"
                  />
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="request-amount">Amount ({currency})</Label>
                  <Input
                    id="request-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    pattern="(0|[1-9][0-9]{0,9})(\.[0-9]{1,2})?"
                    maxLength={13}
                    placeholder="0.00"
                    aria-describedby="amount-help"
                  />
                  <p id="amount-help" className="text-xs text-muted-foreground">
                    Enter the full amount to authorize.
                  </p>
                </div>
                {spending && (
                  <div className="space-y-2">
                    <Label htmlFor="request-category">Spending category</Label>
                    <Select
                      value={category}
                      items={{
                        unplanned: "Unplanned",
                        ...Object.fromEntries(
                          categories.map((item, index) => [
                            String(index),
                            item,
                          ]),
                        ),
                      }}
                      onValueChange={(value) =>
                        value !== null && setCategory(value)
                      }
                    >
                      <SelectTrigger id="request-category" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unplanned">Unplanned</SelectItem>
                        {categories.map((item, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-justification">
                  Why is this needed?
                </Label>
                <textarea
                  id="request-justification"
                  required
                  maxLength={1000}
                  rows={4}
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </>
          )}
          {mutation.error && (
            <Alert variant="destructive">{getApiError(mutation.error)}</Alert>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!!allocation && !recipientId}>
              {mutation.isPending
                ? "Saving…"
                : allocation
                  ? confirming
                    ? "Confirm allocation"
                    : "Review allocation"
                  : "Submit request"}
            </Button>
            {confirming && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirming(false);
                  mutation.reset();
                }}
              >
                Edit allocation
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => leave.request(onClose)}
            >
              Cancel
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
