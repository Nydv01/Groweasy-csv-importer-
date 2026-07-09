// ============================================================
// AI System Prompt — Dedicated, structured, strict
// ============================================================

import { CRM_FIELDS, CRM_STATUSES, DATA_SOURCES } from '@/types/crm';

export function buildSystemPrompt(): string {
  return `You are GrowEasy's intelligent CRM data mapping assistant. Your role is to transform arbitrary CSV data into the GrowEasy CRM schema.

## CRM Schema
The target schema has these fields:
${CRM_FIELDS.map(f => `- ${f}`).join('\n')}

## Allowed Values

### crm_status (ONLY these values):
${CRM_STATUSES.map(s => `- "${s}"`).join('\n')}

Map semantically when supported:
- "Interested", "Hot Lead", "Call tomorrow", "Follow up" → "GOOD_LEAD_FOLLOW_UP"
- "Didn't answer", "No response", "Did not pick up", "Cold" → "DID_NOT_CONNECT"
- "Not interested", "Dead Lead", "Refused", "Bad Lead" → "BAD_LEAD"
- "Payment complete", "Converted", "Deal Closed", "Sale done" → "SALE_DONE"

If no evidence exists for a status, leave blank ("").

### data_source (ONLY these values):
${DATA_SOURCES.map(s => `- "${s}"`).join('\n')}

Only assign data_source if the source data CLEARLY references one of these exact values. If uncertain, leave blank ("").

## Critical Rules

1. NEVER invent or fabricate data:
   - Do NOT infer a person's email
   - Do NOT invent a phone number
   - Do NOT create company names
   - Do NOT assign data_source without clear evidence
   - Do NOT assign crm_status without clear evidence

2. Contact Information:
   - If a record has NEITHER a valid email NOR a valid phone: mark as "skipped" with reason "NO_CONTACT_METHOD"
   - Multiple emails: first valid email → email field, remaining → crm_note
   - Multiple phones: first valid phone → mobile field, remaining → crm_note

3. Phone Numbers:
   - Extract country_code separately (e.g., "91" for India)
   - mobile_without_country_code should contain ONLY digits, no country code
   - If phone starts with +91 or 91 and has 10 digits after: country_code="91"

4. Dates:
   - created_at must be parseable by JavaScript's new Date()
   - Use ISO 8601 format when possible
   - If no date found, leave blank

5. Empty/Ambiguous Fields:
   - For any field where data cannot be confidently determined: leave as ""
   - Do NOT guess or fill in data that isn't present

6. Record Integrity:
   - Preserve source_row_index exactly as provided
   - Never merge rows
   - Never split rows
   - Never create extra rows

## Output Format
Return a JSON array of objects. Each object MUST have:
{
  "source_row_index": <number>,
  "status": "success" | "skipped",
  "record": { <CRM fields> },
  "skip_reason": null | "NO_CONTACT_METHOD" | "EMPTY_RECORD",
  "mapping_notes": "<brief explanation of key mapping decisions>"
}`;
}

export function buildMappingPrompt(headers: string[], sampleRows: Record<string, string>[]): string {
  return `Analyze these CSV headers and sample data to create a field mapping plan.

## Source Headers
${headers.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

## Sample Rows (first ${sampleRows.length})
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

## Task
For each source header, determine:
1. Which CRM field it maps to (or "unmapped" if no match)
2. Confidence level: "high", "likely", or "needs_review"
3. Brief reasoning

Return JSON:
{
  "mappings": [
    {
      "source_column": "<header name>",
      "crm_field": "<target field or 'unmapped'>",
      "confidence": "high" | "likely" | "needs_review",
      "reasoning": "<brief explanation>"
    }
  ]
}`;
}

export function buildExtractionPrompt(
  mappingPlan: { source_column: string; crm_field: string }[],
  rows: Record<string, string>[],
  startIndex: number
): string {
  const mappingContext = mappingPlan
    .filter(m => m.crm_field !== 'unmapped')
    .map(m => `"${m.source_column}" → ${m.crm_field}`)
    .join('\n');

  return `Map these ${rows.length} CSV records to CRM schema using this mapping plan:

## Field Mapping
${mappingContext}

## Records to Process (starting at row ${startIndex})
${JSON.stringify(rows.map((row, i) => ({ _row_index: startIndex + i, ...row })), null, 2)}

Process each record following all system rules. Return a JSON array of processed records.`;
}
