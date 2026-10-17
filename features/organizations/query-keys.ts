export const organizationKeys = {
  all: ["organizations"] as const,
  members: (organizationId: number) =>
    ["organizations", organizationId, "members"] as const,
  structure: (organizationId: number) =>
    ["organizations", organizationId, "structure"] as const,
  invitations: ["organizations", "invitations"] as const,
};
