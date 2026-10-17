export type Role = "organization_admin" | "employee" | "finance" | "manager";
export type UserRole = Role | "platform_admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type SignupInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
