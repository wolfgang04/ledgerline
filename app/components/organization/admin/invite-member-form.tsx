"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelect } from "./role-select";

type InviteMemberFormProps = {
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function InviteMemberForm({
  isPending,
  onSubmit,
}: InviteMemberFormProps) {
  return (
    <form className="invite-form-card" onSubmit={onSubmit}>
      <div>
        <strong>Invite a member</strong>
        <small>
          Invite an existing Ledgerline account to this organization.
        </small>
      </div>
      <Input
        required
        name="email"
        type="email"
        placeholder="teammate@company.com"
      />
      <RoleSelect name="role" defaultValue="employee" />
      <Button disabled={isPending} type="submit">
        {isPending ? "Sending..." : "Send invite"}
      </Button>
    </form>
  );
}
