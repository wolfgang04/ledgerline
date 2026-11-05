"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { financialPercentage, formatFinancialAmount } from "@/lib/budget";
import type { CommitmentOverview } from "./commitments/types";

export function DepartmentBalances({
  data,
  organizationId,
  finance,
}: {
  data: CommitmentOverview;
  organizationId: number;
  finance: boolean;
}) {
  const [sort, setSort] = useState<"name" | "available">("name");
  const currency = data.budget.currency ?? "";
  const money = (amount: string) =>
    `${formatFinancialAmount(amount)} ${currency}`;
  const departments = [...data.departments].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : Number(b.available) - Number(a.available),
  );
  return (
    <section
      className="workspace-panel order-2 xl:order-1"
      aria-labelledby="departments-heading"
    >
      <div className="panel-heading">
        <h2 id="departments-heading">
          {finance ? "Department budgets" : "Department budget"}
        </h2>
        <span className="text-xs text-muted-foreground">{currency}</span>
      </div>
      <div className="hidden md:block">
        <Table aria-label="Department balances">
          <TableHeader>
            <TableRow>
              <TableHead aria-sort={sort === "name" ? "ascending" : "none"}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSort("name")}
                >
                  Department
                  <ArrowUpDown />
                </Button>
              </TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Committed</TableHead>
              <TableHead
                className="text-right"
                aria-sort={sort === "available" ? "descending" : "none"}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSort("available")}
                >
                  Available
                  <ArrowUpDown />
                </Button>
              </TableHead>
              <TableHead className="text-right">Utilized</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((item) => (
              <TableRow key={item.department_id}>
                <TableCell className="max-w-52 whitespace-normal break-words font-medium">
                  {item.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatFinancialAmount(item.allocation)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatFinancialAmount(item.committed)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatFinancialAmount(item.available)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {financialPercentage(item.committed, item.allocation)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y md:hidden">
        {departments.map((item) => (
          <li className="space-y-3 p-5" key={item.department_id}>
            <h3 className="break-words font-medium">{item.name}</h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Allocated", value: money(item.allocation) },
                { label: "Committed", value: money(item.committed) },
                { label: "Available", value: money(item.available) },
                {
                  label: "Utilized",
                  value: `${financialPercentage(item.committed, item.allocation)}%`,
                },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 break-words font-medium tabular-nums">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="border-t px-5 py-3">
        <Link
          className="inline-flex min-h-10 items-center gap-2 font-medium text-primary hover:underline"
          href={`/organizations/${organizationId}/spending?year=${data.budget.fiscal_year}`}
        >
          View spending & allocations
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
