import { LedgerlineMark } from "@/components/brand";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 -z-10 size-56 rounded-full border-[28px] border-sidebar-primary/10"
      />
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-sidebar-muted">
            {description}
          </p>
        </div>
        {action ?? (
          <LedgerlineMark className="hidden size-16 text-sidebar-accent sm:block" />
        )}
      </div>
    </section>
  );
}
