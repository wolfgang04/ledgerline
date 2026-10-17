import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getPlatformOverview, searchUsers, searchOrganizations } from "./api";

const SEARCH_DEBOUNCE_MS = 350;

function useDebouncedValue(value: string) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedValue(value),
      SEARCH_DEBOUNCE_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [value]);

  return debouncedValue;
}

export function usePlatformOverviewQuery() {
  return useQuery({
    queryKey: ["platform", "overview"],
    queryFn: ({ signal }) => getPlatformOverview(signal),
  });
}

export function usePlatformUsersQuery(query: string) {
  const debouncedQuery = useDebouncedValue(query);

  return useQuery({
    queryKey: ["platform", "users", debouncedQuery],
    queryFn: ({ signal }) => searchUsers(debouncedQuery, signal),
  });
}

export function usePlatformOrganizationsQuery(query: string) {
  const debouncedQuery = useDebouncedValue(query);

  return useQuery({
    queryKey: ["platform", "organizations", debouncedQuery],
    queryFn: ({ signal }) => searchOrganizations(debouncedQuery, signal),
  });
}
