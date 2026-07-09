// ============================================================
// Phone Number Normalization — Deterministic
// ============================================================

// Strip all non-digit characters except leading +
function cleanPhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? '+' + digits : digits;
}

export interface PhoneResult {
  countryCode: string;
  mobile: string;
}

export function parsePhoneNumber(raw: string): PhoneResult {
  const cleaned = cleanPhone(raw);
  if (!cleaned) return { countryCode: '', mobile: '' };

  const digits = cleaned.replace('+', '');

  // Indian numbers
  if (cleaned.startsWith('+91') && digits.length === 12) {
    return { countryCode: '91', mobile: digits.slice(2) };
  }
  if (digits.startsWith('91') && digits.length === 12) {
    return { countryCode: '91', mobile: digits.slice(2) };
  }
  if (digits.startsWith('0') && digits.length === 11 && digits[1] >= '6') {
    return { countryCode: '91', mobile: digits.slice(1) };
  }
  if (digits.length === 10 && digits[0] >= '6') {
    return { countryCode: '91', mobile: digits };
  }

  // US/Canada +1
  if (cleaned.startsWith('+1') && digits.length === 11) {
    return { countryCode: '1', mobile: digits.slice(1) };
  }

  // UK +44
  if (cleaned.startsWith('+44') && digits.length >= 12) {
    return { countryCode: '44', mobile: digits.slice(2) };
  }

  // Generic international with +
  if (cleaned.startsWith('+') && digits.length > 10) {
    // Assume first 1-3 digits are country code
    if (digits.length === 13) return { countryCode: digits.slice(0, 3), mobile: digits.slice(3) };
    if (digits.length === 12) return { countryCode: digits.slice(0, 2), mobile: digits.slice(2) };
    if (digits.length === 11) return { countryCode: digits.slice(0, 1), mobile: digits.slice(1) };
  }

  // Fallback: if 10 digits, assume Indian
  if (digits.length === 10) {
    return { countryCode: '91', mobile: digits };
  }

  // Return what we have
  return { countryCode: '', mobile: digits };
}

export function isValidPhone(raw: string): boolean {
  const { mobile } = parsePhoneNumber(raw);
  return mobile.length >= 7 && mobile.length <= 15;
}

export function extractPhoneNumbers(value: string): { primary: PhoneResult; additional: string[] } {
  if (!value) return { primary: { countryCode: '', mobile: '' }, additional: [] };

  // Split by common separators (but not within a number)
  const parts = value.split(/[,;|\/]+/).map(s => s.trim()).filter(Boolean);

  const validPhones: { raw: string; parsed: PhoneResult }[] = [];
  for (const part of parts) {
    if (isValidPhone(part)) {
      validPhones.push({ raw: part, parsed: parsePhoneNumber(part) });
    }
  }

  if (validPhones.length === 0) {
    return { primary: { countryCode: '', mobile: '' }, additional: [] };
  }

  return {
    primary: validPhones[0].parsed,
    additional: validPhones.slice(1).map(p => p.raw),
  };
}
