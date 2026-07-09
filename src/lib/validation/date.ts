// ============================================================
// Date Parsing — Deterministic
// ============================================================

const DATE_FORMATS = [
  // ISO
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /^\d{4}-\d{2}-\d{2}/,
  // US style
  /^\d{1,2}\/\d{1,2}\/\d{4}/,
  /^\d{1,2}-\d{1,2}-\d{4}/,
  // European style
  /^\d{1,2}\.\d{1,2}\.\d{4}/,
  // Long form
  /^[A-Za-z]+ \d{1,2},? \d{4}/,
  /^\d{1,2} [A-Za-z]+ \d{4}/,
];

export function isValidDate(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return false;

  // Sanity check: year between 1900 and 2100
  const year = date.getFullYear();
  return year >= 1900 && year <= 2100;
}

export function parseDate(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  // Try direct parsing first
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return date.toISOString();
    }
  }

  // Try DD/MM/YYYY format (common in India)
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return '';
}
