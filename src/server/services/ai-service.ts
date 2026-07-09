// ============================================================
// AI Service — Gemini AI Integration with Heuristic Fallback
// ============================================================

import { CrmRecord, CRM_FIELDS, CRM_STATUSES, DATA_SOURCES } from '@/types/crm';
import { FieldMapping, ProcessedRecord, SkipReason } from '@/types/import';
import { parsePhoneNumber, isValidPhone } from '@/lib/validation/phone';
import { isValidEmail, extractEmails } from '@/lib/validation/email';
import { parseDate } from '@/lib/validation/date';
import { sanitizeCrmRecord, hasContactMethod, isEmptyRecord, isValidCrmStatus } from '@/lib/validation/schema';
import { sleep } from '@/lib/utils';
import { buildSystemPrompt, buildMappingPrompt, buildExtractionPrompt } from '@/server/prompts/system-prompt';
import { GoogleGenAI } from '@google/genai';

// Initialize modern Google Gemini AI client
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('GEMINI_API_KEY environment variable is missing. AI features will fall back to local heuristics.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ---- Schema Inference Heuristics (for fallback) ----

const FIELD_PATTERNS: Record<string, RegExp[]> = {
  name: [/name/i, /full.?name/i, /contact.?person/i, /prospect/i, /lead\b/i, /customer/i, /person/i, /client/i],
  email: [/email/i, /mail/i, /e-mail/i],
  mobile_without_country_code: [/phone/i, /mobile/i, /whatsapp/i, /contact.?(no|num|1)/i, /cell/i, /primary.?contact/i, /tel/i],
  company: [/company/i, /org/i, /business/i, /firm/i],
  city: [/city/i, /town/i, /place/i, /location/i],
  state: [/state/i, /province/i, /region/i],
  country: [/country/i, /nation/i, /zone/i],
  lead_owner: [/owner/i, /assigned/i, /agent/i, /handler/i, /manager/i, /rep/i],
  crm_status: [/status/i, /stage/i, /disposition/i, /lead.?stage/i],
  crm_note: [/note/i, /remark/i, /comment/i, /feedback/i, /description/i],
  data_source: [/source/i, /campaign/i, /platform/i, /origin/i, /project/i, /interested.?project/i],
  created_at: [/created/i, /date/i, /time/i, /added/i, /registered/i, /timestamp/i],
  possession_time: [/possession/i, /timeline/i, /delivery/i, /handover/i],
  description: [/desc/i, /detail/i, /info/i, /about/i],
  country_code: [/country.?code/i, /dial.?code/i, /isd/i],
};

function getConfidence(header: string, matchedField: string): 'high' | 'likely' | 'needs_review' {
  const h = header.toLowerCase().trim();
  if (h === matchedField || h === matchedField.replace(/_/g, ' ') || h === matchedField.replace(/_/g, '')) {
    return 'high';
  }
  const patterns = FIELD_PATTERNS[matchedField];
  if (patterns && patterns[0].test(h)) return 'high';
  if (patterns && patterns.slice(1, 3).some(p => p.test(h))) return 'likely';
  return 'needs_review';
}

function getReasoning(header: string, field: string, sampleValues: string[]): string {
  const nonEmpty = sampleValues.filter(Boolean).slice(0, 3);
  if (field === 'mobile_without_country_code' && nonEmpty.some(v => /\d{7,}/.test(v.replace(/\D/g, '')))) {
    return `Header "${header}" contains phone-like values (e.g., "${nonEmpty[0]}")`;
  }
  if (field === 'email' && nonEmpty.some(v => v.includes('@'))) {
    return `Header "${header}" contains email addresses`;
  }
  if (field === 'crm_status') {
    return `Header "${header}" contains lead status/disposition values`;
  }
  if (field === 'created_at' && nonEmpty.some(v => !isNaN(Date.parse(v)))) {
    return `Header "${header}" contains parseable dates`;
  }
  return `Header "${header}" semantically maps to ${field}`;
}

export async function inferFieldMappings(
  headers: string[],
  sampleRows: Record<string, string>[]
): Promise<FieldMapping[]> {
  // If actual Gemini AI is available, use it
  if (ai) {
    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildMappingPrompt(headers, sampleRows);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (result && Array.isArray(result.mappings)) {
          return result.mappings.map((m: { source_column?: string; crm_field?: string; confidence?: string; reasoning?: string }) => ({
            source_column: String(m.source_column || ''),
            crm_field: String(m.crm_field || 'unmapped'),
            confidence: (m.confidence && ['high', 'likely', 'needs_review'].includes(m.confidence))
              ? (m.confidence as 'high' | 'likely' | 'needs_review')
              : 'needs_review',
            reasoning: String(m.reasoning || ''),
          })) as FieldMapping[];
        }
      }
    } catch (err) {
      console.error('Gemini schema inference failed, falling back to heuristics:', err);
    }
  }

  // Fallback to local heuristic mapping engine
  const mappings: FieldMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    let bestField: string | null = null;
    let bestScore = 0;

    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (usedFields.has(field)) continue;
      for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].test(header)) {
          const score = patterns.length - i;
          if (score > bestScore) {
            bestScore = score;
            bestField = field;
          }
          break;
        }
      }
    }

    if (bestField) {
      usedFields.add(bestField);
      const sampleValues = sampleRows.map(r => r[header] || '');
      mappings.push({
        source_column: header,
        crm_field: bestField,
        confidence: getConfidence(header, bestField),
        reasoning: getReasoning(header, bestField, sampleValues),
      });
    } else {
      mappings.push({
        source_column: header,
        crm_field: 'unmapped',
        confidence: 'needs_review',
        reasoning: `No CRM field matches header "${header}"`,
      });
    }
  }

  return mappings;
}

// ---- Status & Source Mapping Helpers ----

function mapStatus(value: string): string {
  if (!value) return '';
  const v = value.toLowerCase().trim();

  if (/payment|paid|converted|deal.?closed|sale.?done|signed|registration|complete/i.test(v)) {
    return 'SALE_DONE';
  }
  if (/not.?interested|dead|bad|refused|reject|remove|unqualified/i.test(v)) {
    return 'BAD_LEAD';
  }
  if (/didn.?t.?answer|no.?response|not.?reachable|did.?not.?(connect|pick)|cold|unreachable|no.?contact/i.test(v)) {
    return 'DID_NOT_CONNECT';
  }
  if (/interest|hot|warm|follow|call|demo|meeting|active|qualified|schedule/i.test(v)) {
    return 'GOOD_LEAD_FOLLOW_UP';
  }

  return '';
}

function detectDataSource(row: Record<string, string>): string {
  const allValues = Object.values(row).join(' ').toLowerCase();
  for (const source of DATA_SOURCES) {
    if (allValues.includes(source.toLowerCase().replace(/_/g, ' ')) ||
        allValues.includes(source.toLowerCase())) {
      return source;
    }
  }
  return '';
}

// ---- Record Processing (Local/Fallback version) ----

export function processRecord(
  row: Record<string, string>,
  mappings: FieldMapping[],
  rowIndex: number
): ProcessedRecord {
  const record: Partial<CrmRecord> = {};
  const notes: string[] = [];

  for (const mapping of mappings) {
    if (mapping.crm_field === 'unmapped') continue;
    const value = row[mapping.source_column] || '';
    if (!value.trim()) continue;

    const field = mapping.crm_field as keyof CrmRecord;

    switch (field) {
      case 'email': {
        const extracted = extractEmails(value);
        record.email = extracted.primary;
        if (extracted.additional.length > 0) {
          notes.push('Additional emails: ' + extracted.additional.join(', '));
        }
        break;
      }
      case 'mobile_without_country_code': {
        const parsed = parsePhoneNumber(value);
        if (parsed.mobile) {
          record.country_code = parsed.countryCode;
          record.mobile_without_country_code = parsed.mobile;
          
          const altPhoneMappings = mappings.filter(
            m => m.source_column !== mapping.source_column &&
            /contact.?2|alternate|secondary|other.?phone/i.test(m.source_column)
          );
          for (const alt of altPhoneMappings) {
            const altVal = row[alt.source_column];
            if (altVal && isValidPhone(altVal)) {
              notes.push('Additional phone: ' + altVal);
            }
          }
        }
        break;
      }
      case 'crm_status': {
        record.crm_status = mapStatus(value) as CrmRecord['crm_status'];
        break;
      }
      case 'data_source': {
        const lower = value.toLowerCase().replace(/[\s-]/g, '_');
        if (DATA_SOURCES.includes(lower as typeof DATA_SOURCES[number])) {
          record.data_source = lower as CrmRecord['data_source'];
        }
        break;
      }
      case 'created_at': {
        record.created_at = parseDate(value);
        break;
      }
      default: {
        (record as Record<string, string>)[field] = value.trim();
      }
    }
  }

  if (!record.data_source) {
    const detected = detectDataSource(row);
    if (detected) record.data_source = detected as CrmRecord['data_source'];
  }

  for (const mapping of mappings) {
    if (mapping.crm_field !== 'unmapped') continue;
    const val = row[mapping.source_column] || '';
    if (!val.trim()) continue;

    if (isValidEmail(val) && !record.email) {
      record.email = val.trim();
    } else if (isValidEmail(val) && record.email) {
      notes.push(`Additional email from "${mapping.source_column}": ${val}`);
    }

    if (isValidPhone(val) && !record.mobile_without_country_code) {
      const parsed = parsePhoneNumber(val);
      record.country_code = parsed.countryCode;
      record.mobile_without_country_code = parsed.mobile;
    } else if (isValidPhone(val) && record.mobile_without_country_code) {
      notes.push(`Additional phone from "${mapping.source_column}": ${val}`);
    }
  }

  if (notes.length > 0) {
    record.crm_note = (record.crm_note ? record.crm_note + '; ' : '') + notes.join('; ');
  }

  const sanitized = sanitizeCrmRecord(record);

  if (isEmptyRecord(sanitized)) {
    return {
      source_row_index: rowIndex,
      status: 'skipped',
      record: sanitized,
      skip_reason: 'EMPTY_RECORD',
      mapping_notes: 'Record contains no usable data',
    };
  }

  if (!hasContactMethod(sanitized)) {
    return {
      source_row_index: rowIndex,
      status: 'skipped',
      record: sanitized,
      skip_reason: 'NO_CONTACT_METHOD',
      mapping_notes: 'No valid email or mobile number found',
    };
  }

  return {
    source_row_index: rowIndex,
    status: 'success',
    record: sanitized,
    skip_reason: null,
    mapping_notes: `Mapped from ${mappings.filter(m => m.crm_field !== 'unmapped').length} source columns`,
  };
}

// ---- AI Post-Processing Validation/Sanitization ----

interface GeminiRecordOutput {
  record?: Record<string, unknown>;
  status?: string;
  skip_reason?: string | null;
  mapping_notes?: string;
  source_row_index?: number;
  [key: string]: unknown;
}

function postProcessRecord(
  aiRecord: GeminiRecordOutput,
  rawRow: Record<string, string>,
  rowIndex: number
): ProcessedRecord {
  const recData = (aiRecord.record || aiRecord) as Record<string, unknown>;
  
  const record: Partial<CrmRecord> = {
    created_at: recData.created_at ? parseDate(String(recData.created_at)) : '',
    name: String(recData.name || '').trim(),
    email: String(recData.email || '').trim(),
    country_code: String(recData.country_code || '').trim(),
    mobile_without_country_code: String(recData.mobile_without_country_code || '').trim(),
    company: String(recData.company || '').trim(),
    city: String(recData.city || '').trim(),
    state: String(recData.state || '').trim(),
    country: String(recData.country || '').trim(),
    lead_owner: String(recData.lead_owner || '').trim(),
    crm_status: String(recData.crm_status || '').trim() as CrmRecord['crm_status'],
    crm_note: String(recData.crm_note || '').trim(),
    data_source: String(recData.data_source || '').trim() as CrmRecord['data_source'],
    possession_time: String(recData.possession_time || '').trim(),
    description: String(recData.description || '').trim(),
  };

  // Run phone number cleaner/validator in code
  if (record.mobile_without_country_code) {
    const parsed = parsePhoneNumber(record.mobile_without_country_code);
    if (parsed.mobile) {
      record.country_code = record.country_code || parsed.countryCode;
      record.mobile_without_country_code = parsed.mobile;
    }
  }

  // Ensure email validity and clean multiple emails
  if (record.email) {
    const extracted = extractEmails(record.email);
    record.email = extracted.primary;
    if (extracted.additional.length > 0) {
      record.crm_note = (record.crm_note ? record.crm_note + '; ' : '') + 'Additional emails: ' + extracted.additional.join(', ');
    }
  }

  // Status mapping validation
  if (record.crm_status && !isValidCrmStatus(record.crm_status)) {
    record.crm_status = mapStatus(record.crm_status) as CrmRecord['crm_status'];
  }

  const sanitized = sanitizeCrmRecord(record);

  let status: 'success' | 'skipped' = 'success';
  let skipReason: SkipReason | null = null;
  let mappingNotes = aiRecord.mapping_notes || `Mapped using AI mapping plan`;

  if (isEmptyRecord(sanitized)) {
    status = 'skipped';
    skipReason = 'EMPTY_RECORD';
    mappingNotes = 'Record contains no usable data';
  } else if (!hasContactMethod(sanitized)) {
    status = 'skipped';
    skipReason = 'NO_CONTACT_METHOD';
    mappingNotes = 'No valid email or mobile number found';
  }

  return {
    source_row_index: rowIndex,
    status,
    record: sanitized,
    skip_reason: skipReason,
    mapping_notes: mappingNotes,
  };
}

// ---- Batch Processing ----

export interface BatchResult {
  batchIndex: number;
  records: ProcessedRecord[];
  error: string | null;
  retries: number;
}

export async function processBatch(
  rows: Record<string, string>[],
  mappings: FieldMapping[],
  startIndex: number,
  batchIndex: number
): Promise<BatchResult> {
  // If actual Gemini AI is available, use it
  if (ai) {
    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildExtractionPrompt(mappings, rows, startIndex);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsedRecords = JSON.parse(text);
        if (Array.isArray(parsedRecords)) {
          const results: ProcessedRecord[] = [];
          for (let i = 0; i < rows.length; i++) {
            const rawRow = rows[i];
            const globalIndex = startIndex + i;
            
            // Match corresponding record by index
            const aiRecord = parsedRecords.find(r => r.source_row_index === globalIndex) || 
                              parsedRecords[i] || 
                              { record: {} };

            const validated = postProcessRecord(aiRecord, rawRow, globalIndex);
            results.push(validated);
          }

          return {
            batchIndex,
            records: results,
            error: null,
            retries: 0,
          };
        }
      }
    } catch (err) {
      console.error(`Gemini batch processing failed for batch ${batchIndex + 1}, falling back to local heuristics:`, err);
    }
  }

  // Fallback to local heuristic processing
  await sleep(800 + Math.random() * 1200);

  const results: ProcessedRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    results.push(processRecord(rows[i], mappings, startIndex + i));
  }

  return {
    batchIndex,
    records: results,
    error: null,
    retries: 0,
  };
}

export const BATCH_SIZE = 50;
