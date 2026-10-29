const npr = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("en-IN");

const score = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export const formatNPR = (value: number) => npr.format(value);
export const formatInt = (value: number) => integer.format(value);
export const formatScore = (value: number) => score.format(value);

/** Formats a YYYY-MM-DD date without shifting it through the viewer's timezone. */
export function formatMatchDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
