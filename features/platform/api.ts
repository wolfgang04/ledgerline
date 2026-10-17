import { api } from "@/lib/api";
import type { Organization } from "@/features/organizations/types";
import type { PlatformMetrics, PlatformUser } from "./types";

export async function getPlatformOverview(signal?: AbortSignal) {
  return (
    await api.get<{ metrics: PlatformMetrics }>("/platform/overview", {
      signal,
    })
  ).data;
}

export async function searchUsers(query: string, signal?: AbortSignal) {
  return (
    await api.get<{ users: PlatformUser[] }>("/platform/users", {
      params: { q: query },
      signal,
    })
  ).data;
}

export async function searchOrganizations(query: string, signal?: AbortSignal) {
  return (
    await api.get<{ organizations: Organization[] }>(
      "/platform/organizations",
      { params: { q: query }, signal },
    )
  ).data;
}
