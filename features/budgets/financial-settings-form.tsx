import { type FormEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyCombobox } from "./currency-combobox";
import type { FinancialSettings } from "./types";

const months = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(Date.UTC(2000, index, 1)).toLocaleDateString("en", {
    month: "long",
    timeZone: "UTC",
  }),
}));

export function FinancialSettingsForm({
  settings,
  currencies,
  pending,
  onSave,
}: {
  settings: FinancialSettings;
  currencies: string[];
  pending: boolean;
  onSave: (
    settings: Pick<FinancialSettings, "currency" | "fiscal_year_start_month">,
  ) => void;
}) {
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      fiscal_year_start_month: Number(data.get("month")),
      currency: String(data.get("currency")),
    });
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the financial calendar and currency before creating your first
        proposal. These settings lock when the first proposal is created.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label id="fiscal-month-label">Financial year starts in</Label>
          <Select
            name="month"
            required
            defaultValue={String(settings.fiscal_year_start_month ?? 1)}
            disabled={pending}
            items={Object.fromEntries(
              months.map((month) => [month.value, month.label]),
            )}
          >
            <SelectTrigger
              className="w-full"
              aria-labelledby="fiscal-month-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label id="currency-label">Currency</Label>
          <CurrencyCombobox
            currencies={currencies}
            value={settings.currency}
            disabled={pending}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save financial settings"}
      </Button>
    </form>
  );
}
