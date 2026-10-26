import type { Role } from "@/features/auth/types";

export type Organization = {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
  role?: Role;
  department_id?: number | null;
};

export type OrganizationMember = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  department_id?: number | null;
  created_at: string;
};

export type TeamMember = Pick<
  OrganizationMember,
  "user_id" | "first_name" | "last_name" | "email"
> & {
  role?: string | null;
};

export type Team = {
  id: number;
  name: string;
  department_id: number;
  members: TeamMember[];
};

export type Department = {
  id: number;
  name: string;
  member_count: number;
  teams: Team[];
};

export type Invitation = {
  id: number;
  organization_id: number;
  organization_name: string;
  email: string;
  role: Role;
  created_at: string;
};
