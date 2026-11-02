export function Metrics({
  items,
}: {
  items: { label: string; value: number | string }[];
}) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y py-5 sm:gap-x-16">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-3">
          <dd className="order-1 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </dd>
          <dt className="order-2 text-sm text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
