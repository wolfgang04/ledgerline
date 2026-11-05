"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useBudgetLocation() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  return {
    params,
    // Callers guard user navigation; successful saves must still replace the record URL.
    update(values: Record<string, string | number | null>) {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(values)) {
        if (value === null) next.delete(key);
        else next.set(key, String(value));
      }
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    },
  };
}
