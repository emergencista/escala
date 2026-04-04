export function parseDateOnlyInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    throw new Error("Invalid date format. Expected yyyy-mm-dd");
  }

  // Store date-only values at 12:00 UTC to avoid day shifting across time zones.
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function formatDateFromIso(value: string): string {
  const isoDate = value.slice(0, 10);
  const [year, month, day] = isoDate.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}
