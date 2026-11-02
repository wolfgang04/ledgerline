export function fiscalYearRange(year: number, month: number) {
  const date = (value: Date) =>
    value.toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${date(new Date(Date.UTC(year, month - 1, 1)))} – ${date(new Date(Date.UTC(year + 1, month - 1, 0)))}`;
}
