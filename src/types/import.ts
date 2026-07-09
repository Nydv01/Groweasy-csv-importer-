// ============================================================
// Import Job Types
// ============================================================

import { CrmRecord } from './crm';

export type AppState =
  | 'initial'
  | 'drag-over'
  | 'file-accepted'
  | 'parsing'
  | 'preview'
  | 'confirming'
  | 'processing'
  | 'batch-progress'
  | 'results'
  | 'skipped-inspection'
  | 'error'
  | 'import-another';

export type JobStatus =
  | 'queued'
  | 'parsing'
  | 'mapping'
  | 'validating'
  | 'retrying'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed';

export type RecordStatus = 'success' | 'skipped';

export type SkipReason =
  | 'NO_CONTACT_METHOD'
  | 'INVALID_EMAIL_AND_NO_PHONE'
  | 'EMPTY_RECORD'
  | 'AI_VALIDATION_FAILED'
  | 'UNRECOVERABLE_BATCH_ERROR';

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  NO_CONTACT_METHOD: 'No valid email or mobile number found',
  INVALID_EMAIL_AND_NO_PHONE: 'Email is invalid and no phone number available',
  EMPTY_RECORD: 'Record contains no usable data',
  AI_VALIDATION_FAILED: 'AI could not validate this record',
  UNRECOVERABLE_BATCH_ERROR: 'Processing batch failed permanently',
};

export interface ProcessedRecord {
  source_row_index: number;
  status: RecordStatus;
  record: CrmRecord;
  skip_reason: SkipReason | null;
  mapping_notes: string;
}

export interface FieldMapping {
  source_column: string;
  crm_field: string;
  confidence: 'high' | 'likely' | 'needs_review';
  reasoning: string;
}

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  processedRecords: number;
  totalRecords: number;
  successfulRecords: number;
  skippedRecords: number;
  failedBatches: number;
  retriedBatches: number;
  currentPhase: string;
  fieldMappings: FieldMapping[];
}

export interface ImportJob {
  id: string;
  status: JobStatus;
  fileName: string;
  totalRecords: number;
  progress: BatchProgress;
  results: ProcessedRecord[];
  skipped: ProcessedRecord[];
  fieldMappings: FieldMapping[];
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface FileInfo {
  name: string;
  size: number;
  rows: number;
  columns: number;
  delimiter: string;
  encoding: string;
  headers: string[];
}

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
  delimiter: string;
  rowCount: number;
  columnCount: number;
}

export interface SSEEvent {
  type: 'progress' | 'batch_complete' | 'mapping' | 'complete' | 'error' | 'retry';
  data: BatchProgress | FieldMapping[] | ProcessedRecord[] | { message: string };
}
