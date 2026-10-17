import type { UserRole } from "@/features/auth/types";

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
