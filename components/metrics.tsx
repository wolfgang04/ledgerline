export function Metrics({
  items,
}: {
  items: { label: string; value: number | string }[];
}) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-4 rounded-lg border bg-card px-5 py-4">
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0 flex-1 basis-40">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-xl font-semibold tracking-tight tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
