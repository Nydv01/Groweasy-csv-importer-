// ============================================================
// Email Validation — Deterministic, no AI needed
// ============================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed) && trimmed.length <= 254;
}

export function extractEmails(value: string): { primary: string; additional: string[] } {
  if (!value) return { primary: '', additional: [] };

  // Split by common separators
  const parts = value.split(/[,;|\s]+/).map(s => s.trim()).filter(Boolean);
  const validEmails = parts.filter(isValidEmail);

  if (validEmails.length === 0) {
    return { primary: '', additional: [] };
  }

  return {
    primary: validEmails[0],
    additional: validEmails.slice(1),
  };
}
