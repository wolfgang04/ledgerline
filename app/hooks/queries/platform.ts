import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Organization, type UserRole } from "../../lib/api";

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

export type PlatformMetrics = {
  users: number;
  organizations: number;
  memberships: number;
};

export type PlatformUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

async function getPlatformOverview() {
  return (await api.get<{ metrics: PlatformMetrics }>("/platform/overview")).data;
}

async function searchUsers(query: string) {
  return (await api.get<{ users: PlatformUser[] }>("/platform/users", { params: { q: query } })).data;
}

async function searchOrganizations(query: string) {
  return (await api.get<{ organizations: Organization[] }>("/platform/organizations", { params: { q: query } })).data;
}

export function usePlatformOverviewQuery() {
  return useQuery({ queryKey: ["platform", "overview"], queryFn: getPlatformOverview });
}

export function usePlatformUsersQuery(query: string) {
  const debouncedQuery = useDebouncedValue(query);

  return useQuery({
    queryKey: ["platform", "users", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
  });
}

export function usePlatformOrganizationsQuery(query: string) {
  const debouncedQuery = useDebouncedValue(query);

  return useQuery({
    queryKey: ["platform", "organizations", debouncedQuery],
    queryFn: () => searchOrganizations(debouncedQuery),
  });
}