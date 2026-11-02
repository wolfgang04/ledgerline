import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 p-6 sm:p-10">
      <Brand />
      <div className="mt-8 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This address doesn’t lead to a page on Ledgerline. Return to your
          workspace to continue.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ className: "self-start" })}>
        Return to workspace
      </Link>
    </main>
  );
}
