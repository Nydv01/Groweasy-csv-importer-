// ============================================================
// CRM Schema Validation — Deterministic
// ============================================================

import { CRM_STATUSES, DATA_SOURCES, type CrmRecord, type CrmStatus, type DataSource } from '@/types/crm';

export function isValidCrmStatus(value: string): value is CrmStatus {
  return CRM_STATUSES.includes(value as CrmStatus);
}

export function isValidDataSource(value: string): value is DataSource {
  return DATA_SOURCES.includes(value as DataSource);
}

export function sanitizeCrmRecord(raw: Partial<CrmRecord>): CrmRecord {
  return {
    created_at: raw.created_at || '',
    name: (raw.name || '').trim(),
    email: (raw.email || '').trim().toLowerCase(),
    country_code: (raw.country_code || '').replace(/\D/g, ''),
    mobile_without_country_code: (raw.mobile_without_country_code || '').replace(/\D/g, ''),
    company: (raw.company || '').trim(),
    city: (raw.city || '').trim(),
    state: (raw.state || '').trim(),
    country: (raw.country || '').trim(),
    lead_owner: (raw.lead_owner || '').trim(),
    crm_status: isValidCrmStatus(raw.crm_status || '') ? raw.crm_status as CrmStatus : '',
    crm_note: (raw.crm_note || '').trim(),
    data_source: isValidDataSource(raw.data_source || '') ? raw.data_source as DataSource : '',
    possession_time: (raw.possession_time || '').trim(),
    description: (raw.description || '').trim(),
  };
}

export function hasContactMethod(record: CrmRecord): boolean {
  return !!(record.email || record.mobile_without_country_code);
}

export function isEmptyRecord(record: CrmRecord): boolean {
  return !record.name && !record.email && !record.mobile_without_country_code && !record.company;
}
