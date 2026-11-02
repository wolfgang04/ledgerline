import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { useBudgetMutation } from "./queries";
import type { ProposalDetail } from "./types";

export type ProposalDialogAction = "submit" | "revision" | "commit" | null;
export function ProposalDialogs({
  mutation,
  shown,
  action,
  onActionChange,
  onRevision,
  onNotice,
}: {
  mutation: ReturnType<typeof useBudgetMutation>;
  shown: ProposalDetail;
  action: ProposalDialogAction;
  onActionChange: (action: ProposalDialogAction) => void;
  onRevision: () => void;
  onNotice: Notify;
}) {
  const planId = shown.plan.id;
  const allApproved = shown.approval_stage === "ready_to_commit";
  const error = (value: unknown) =>
    onNotice({ type: "error", text: getApiError(value) });
  return (
    <>
      <Dialog
        open={action === "submit"}
        onOpenChange={(open) => {
          if (!mutation.isPending) onActionChange(open ? "submit" : null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {shown?.plan.revision_number
              ? "Resubmit proposal for review?"
              : "Submit proposal for review?"}
          </DialogTitle>
          <DialogDescription>
            This freezes the saved values as a new submitted version. Department
            managers review first, followed by the overall manager. Previous
            approvals do not carry over.
          </DialogDescription>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!shown) return;
              const summary = String(
                new FormData(event.currentTarget).get("summary"),
              );
              mutation.mutate(
                {
                  kind: "submit",
                  planId,
                  updated_at: shown.plan.updated_at,
                  summary,
                },
                {
                  onError: error,
                  onSuccess: () => {
                    onActionChange(null);
                    onNotice({
                      type: "success",
                      text: "Proposal submitted for department review.",
                    });
                  },
                },
              );
            }}
          >
            <Label htmlFor="submission-summary">Submission summary</Label>
            <textarea
              id="submission-summary"
              name="summary"
              required
              maxLength={1000}
              rows={3}
              className="w-full rounded-lg border p-3"
            />
            <Button type="submit" disabled={mutation.isPending}>
              Confirm submission
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={action === "revision"}
        onOpenChange={(open) => {
          if (!mutation.isPending) onActionChange(open ? "revision" : null);
        }}
      >
        <DialogContent>
          <DialogTitle>Start a finance revision</DialogTitle>
          <DialogDescription>
            The submitted version remains unchanged. Save your working changes,
            then explicitly resubmit them for a fresh review.
          </DialogDescription>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const reason = String(
                new FormData(event.currentTarget).get("reason"),
              );
              mutation.mutate(
                {
                  kind: "start-revision",
                  planId,
                  updated_at: shown.plan.updated_at,
                  reason,
                },
                {
                  onError: error,
                  onSuccess: () => {
                    onActionChange(null);
                    onRevision();
                    onNotice({
                      type: "success",
                      text: "Finance revision started.",
                    });
                  },
                },
              );
            }}
          >
            <Label htmlFor="revision-reason">Reason for revision</Label>
            <textarea
              id="revision-reason"
              name="reason"
              required
              maxLength={1000}
              rows={3}
              disabled={mutation.isPending}
              className="w-full rounded-lg border bg-card p-3"
            />
            <Button type="submit" disabled={mutation.isPending}>
              Start revision and record reason
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={action === "commit"}
        onOpenChange={(open) => {
          if (!mutation.isPending) onActionChange(open ? "commit" : null);
        }}
      >
        <DialogContent>
          <DialogTitle>Commit approved budget?</DialogTitle>
          <DialogDescription>
            This activates department budgets from submitted version{" "}
            {shown?.plan.revision_number}, preserving its annual total and
            reserve. The committed proposal cannot be edited.
          </DialogDescription>
          <Button
            disabled={
              mutation.isPending ||
              !allApproved ||
              shown?.plan.status !== "under_review"
            }
            onClick={() => {
              if (!shown) return;
              mutation.mutate(
                {
                  kind: "commit",
                  planId,
                  updated_at: shown.plan.updated_at,
                },
                {
                  onError: error,
                  onSuccess: () => {
                    onActionChange(null);
                    onNotice({
                      type: "success",
                      text: "Approved budget committed. Department budgets are active.",
                    });
                  },
                },
              );
            }}
          >
            Confirm budget commitment
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
