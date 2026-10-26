import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { currencyLabel, matchesCurrency } from "@/lib/budget";

export function CurrencyCombobox({
  currencies,
  value,
  disabled,
}: {
  currencies: string[];
  value: string | null;
  disabled: boolean;
}) {
  return (
    <Combobox.Root
      name="currency"
      required
      defaultValue={value}
      items={currencies}
      itemToStringLabel={currencyLabel}
      filter={matchesCurrency}
      disabled={disabled}
    >
      <div className="relative">
        <Combobox.Input
          aria-labelledby="currency-label"
          placeholder="Search currencies…"
          render={<Input className="pr-10" />}
        />
        <Combobox.Trigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              aria-label="Show currencies"
            />
          }
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className="w-(--anchor-width) min-w-48 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
            <Combobox.Empty className="p-3 text-sm text-muted-foreground">
              No currencies found
            </Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto">
              {(currency: string) => (
                <Combobox.Item
                  key={currency}
                  value={currency}
                  className="flex cursor-default items-center justify-between rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {currencyLabel(currency)}
                  <Combobox.ItemIndicator>
                    <Check className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
