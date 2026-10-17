"use client";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Notify } from "@/components/notice";
import { getApiError } from "@/lib/api";
export function CreateStructureForm({
  kind,
  pending,
  onCreate,
  onNotice,
}: {
  kind: "Department" | "Team";
  pending: boolean;
  onCreate: (name: string) => Promise<unknown>;
  onNotice: Notify;
}) {
  const id = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCreate(String(new FormData(form).get("name")));
      form.reset();
      onNotice({ type: "success", text: `${kind} created.` });
    } catch (error) {
      onNotice({ type: "error", text: getApiError(error) });
    }
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-primary/25 bg-accent/20 p-4"
    >
      <div className="min-w-40 flex-1 space-y-2">
        <Label htmlFor={id}>{kind} name</Label>
        <Input id={id} name="name" required maxLength={255} />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Creating..." : `Create ${kind.toLowerCase()}`}
      </Button>
    </form>
  );
}
