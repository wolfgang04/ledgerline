import type { Notify } from "@/components/notice";
import { QueryState } from "@/components/query-state";
import { getApiError } from "@/lib/api";
import type { FinancialSettings } from "./types";
import { useBudgetDepartments, useBudgetMutation } from "./queries";
import { ProposalForm } from "./proposal-form";

export function NewProposal({
  organizationId,
  settings,
  onNotice,
  onCreated,
  onClose,
}: {
  organizationId: number;
  settings: FinancialSettings;
  onNotice: Notify;
  onCreated: (id: number) => void;
  onClose: () => void;
}) {
  const departments = useBudgetDepartments(organizationId);
  const mutation = useBudgetMutation(organizationId);
  return (
    <QueryState loading={departments.isLoading} error={departments.error}>
      {departments.data && (
        <ProposalForm
          allocations={departments.data.departments
            .filter((department) => department.eligible)
            .map((department) => ({
              department_id: department.id,
              name: department.name,
              proposed_amount: "0.00",
            }))}
          departments={departments.data.departments}
          currency={settings.currency!}
          month={settings.fiscal_year_start_month!}
          pending={mutation.isPending}
          onCancel={onClose}
          onSave={(values) =>
            mutation.mutate(
              { kind: "create", values },
              {
                onError: (error) =>
                  onNotice({ type: "error", text: getApiError(error) }),
                onSuccess: (plan) => {
                  if (plan) onCreated(plan.id);
                  onNotice({ type: "success", text: "Draft saved." });
                },
              },
            )
          }
        />
      )}
    </QueryState>
  );
}
