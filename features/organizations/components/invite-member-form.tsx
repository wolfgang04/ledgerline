import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RoleSelect } from "./role-select";
export function InviteMemberForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a member</CardTitle>
        <CardDescription>
          Invite an existing Ledgerline account to this organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap items-end gap-4" onSubmit={onSubmit}>
          <div className="min-w-48 flex-1 space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              required
              name="email"
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <span id="invite-role-label" className="text-sm font-medium">
              Role
            </span>
            <RoleSelect
              name="role"
              defaultValue="employee"
              ariaLabelledBy="invite-role-label"
            />
          </div>
          <Button disabled={isPending} type="submit">
            {isPending ? "Sending..." : "Send invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
