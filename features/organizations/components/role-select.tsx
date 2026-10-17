"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/features/auth/types";

export const organizationRoles: Role[] = [
  "employee",
  "finance",
  "manager",
  "organization_admin",
];

export function formatRole(role: Role) {
  return role.replace("_", " ");
}

type RoleSelectProps = {
  value?: Role;
  defaultValue?: Role;
  onChange?: (value: Role) => void;
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
};

export function RoleSelect({
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  ariaLabel,
  ariaLabelledBy,
}: RoleSelectProps) {
  return (
    <Select
      {...(value !== undefined ? { value } : { defaultValue })}
      disabled={disabled}
      name={name}
      items={Object.fromEntries(
        organizationRoles.map((role) => [role, formatRole(role)]),
      )}
      onValueChange={(next) => {
        if (typeof next === "string") onChange?.(next as Role);
      }}
    >
      <SelectTrigger
        className="w-full min-w-35"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {organizationRoles.map((role) => (
          <SelectItem key={role} value={role}>
            {formatRole(role)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
