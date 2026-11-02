export function organizationHref({
  id,
  role,
}: {
  id: number;
  role?: string | null;
}) {
  return `/organizations/${id}${role === "finance" || role === "manager" ? "/budgets" : ""}`;
}
