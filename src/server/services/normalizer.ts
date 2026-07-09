// ============================================================
// Deterministic Record Normalizer — Post-AI validation & cleanup
// ============================================================

import { CrmRecord } from '@/types/crm';
import { extractEmails, isValidEmail } from '@/lib/validation/email';
import { extractPhoneNumbers, parsePhoneNumber } from '@/lib/validation/phone';
import { parseDate } from '@/lib/validation/date';
import { sanitizeCrmRecord, hasContactMethod, isEmptyRecord, isValidCrmStatus, isValidDataSource } from '@/lib/validation/schema';
import { ProcessedRecord, SkipReason } from '@/types/import';

export function normalizeRecord(
  rawRecord: Partial<CrmRecord>,
  sourceRow: Record<string, string>,
  rowIndex: number
): ProcessedRecord {
  // Start with sanitized base
  const record = sanitizeCrmRecord(rawRecord);

  // Normalize email — deterministic
  if (record.email && !isValidEmail(record.email)) {
    // Try to extract from source
    const allEmailFields = Object.entries(sourceRow)
      .filter(([k]) => /email|mail/i.test(k))
      .map(([, v]) => v)
      .join(', ');
    const extracted = extractEmails(allEmailFields || record.email);
    record.email = extracted.primary;
    if (extracted.additional.length > 0) {
      const existing = record.crm_note ? record.crm_note + '; ' : '';
      record.crm_note = existing + 'Additional emails: ' + extracted.additional.join(', ');
    }
  }

  // Normalize phone — deterministic
  if (record.mobile_without_country_code) {
    const allPhoneFields = Object.entries(sourceRow)
      .filter(([k]) => /phone|mobile|whatsapp|contact|cell/i.test(k))
      .map(([, v]) => v)
      .join(', ');
    const extracted = extractPhoneNumbers(allPhoneFields || record.mobile_without_country_code);
    if (extracted.primary.mobile) {
      record.country_code = extracted.primary.countryCode || record.country_code;
      record.mobile_without_country_code = extracted.primary.mobile;
      if (extracted.additional.length > 0) {
        const existing = record.crm_note ? record.crm_note + '; ' : '';
        record.crm_note = existing + 'Additional phones: ' + extracted.additional.join(', ');
      }
    }
  }

  // Normalize date — deterministic
  if (record.created_at) {
    const parsed = parseDate(record.created_at);
    record.created_at = parsed;
  }

  // Validate enums
  if (record.crm_status && !isValidCrmStatus(record.crm_status)) {
    record.crm_status = '';
  }
  if (record.data_source && !isValidDataSource(record.data_source)) {
    record.data_source = '';
  }

  // Check skip conditions
  if (isEmptyRecord(record)) {
    return {
      source_row_index: rowIndex,
      status: 'skipped',
      record,
      skip_reason: 'EMPTY_RECORD',
      mapping_notes: 'Record contains no usable data',
    };
  }

  if (!hasContactMethod(record)) {
    return {
      source_row_index: rowIndex,
      status: 'skipped',
      record,
      skip_reason: 'NO_CONTACT_METHOD',
      mapping_notes: 'No valid email or mobile number found',
    };
  }

  return {
    source_row_index: rowIndex,
    status: 'success',
    record,
    skip_reason: null,
    mapping_notes: '',
  };
}
