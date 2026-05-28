export function parseSex(value: string): "M" | "F" | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["m", "male", "masculino"].includes(normalized)) return "M";
  if (["f", "female", "feminino"].includes(normalized)) return "F";
  return null;
}

export function normalizeDateField(value: string): string | null {
  if (!value.trim()) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) return null;
    return value;
  }

  const ptMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, day, month, year] = ptMatch;
    if (!isValidDateParts(Number(year), Number(month), Number(day))) return null;
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function normalizeAgeField(value: string): number | null {
  if (!value.trim()) return null;
  const age = Number(value);
  if (!Number.isInteger(age)) return null;
  return age;
}

export function isValidDateParts(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
