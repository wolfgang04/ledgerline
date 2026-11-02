"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 p-6 sm:p-10">
      <Brand />
      <div className="mt-8 space-y-3" role="alert">
        <h1 className="text-3xl font-semibold tracking-tight">
          This page couldn’t load
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Try loading the page again, or return to your workspace.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={retry}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
