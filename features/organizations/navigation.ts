export function organizationHref({
  id,
  role,
  department_id,
}: {
  id: number;
  role?: string | null;
  department_id?: number | null;
}) {
  const destination =
    role === "finance" || (role === "manager" && department_id)
      ? "/overview"
      : role === "manager"
        ? "/budgets"
        : role === "employee" && department_id
          ? "/spending"
          : "";
  return `/organizations/${id}${destination}`;
}
