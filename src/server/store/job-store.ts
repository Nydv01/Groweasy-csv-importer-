// ============================================================
// Database Store — Supabase Storage with In-Memory Fallback
// ============================================================

import { ImportJob, ProcessedRecord, FieldMapping, BatchProgress } from '@/types/import';
import { supabase } from '@/lib/supabase';

const globalForJobs = globalThis as unknown as {
  jobs?: Map<string, ImportJob>;
  jobRecords?: Map<string, Record<string, string>[]>;
};

if (!globalForJobs.jobs) {
  globalForJobs.jobs = new Map<string, ImportJob>();
}
if (!globalForJobs.jobRecords) {
  globalForJobs.jobRecords = new Map<string, Record<string, string>[]>();
}

const jobs = globalForJobs.jobs;
const jobRecords = globalForJobs.jobRecords;

export async function createJob(
  id: string,
  fileName: string,
  records: Record<string, string>[]
): Promise<ImportJob> {
  const job: ImportJob = {
    id,
    status: 'queued',
    fileName,
    totalRecords: records.length,
    progress: {
      currentBatch: 0,
      totalBatches: 0,
      processedRecords: 0,
      totalRecords: records.length,
      successfulRecords: 0,
      skippedRecords: 0,
      failedBatches: 0,
      retriedBatches: 0,
      currentPhase: 'Queued',
      fieldMappings: [],
    },
    results: [],
    skipped: [],
    fieldMappings: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };

  // 1. In-Memory Backup
  jobs.set(id, job);
  jobRecords.set(id, records);

  // 2. Supabase Storage (if configured)
  if (supabase) {
    try {
      const { error } = await supabase.from('import_jobs').insert({
        id,
        status: job.status,
        file_name: job.fileName,
        total_records: job.totalRecords,
        progress: job.progress,
        field_mappings: job.fieldMappings,
        raw_records: records,
        results: job.results,
        skipped: job.skipped,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        error: job.error,
      });

      if (error) {
        console.error('Supabase error inserting job:', error);
      }
    } catch (err) {
      console.error('Failed to write job to Supabase:', err);
    }
  }

  return job;
}

export async function getJob(id: string): Promise<ImportJob | undefined> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Supabase error fetching job:', error);
      } else if (data) {
        return {
          id: data.id,
          status: data.status,
          fileName: data.file_name,
          totalRecords: data.total_records,
          progress: data.progress,
          results: data.results || [],
          skipped: data.skipped || [],
          fieldMappings: data.field_mappings || [],
          startedAt: data.started_at,
          completedAt: data.completed_at,
          error: data.error,
        } as ImportJob;
      }
    } catch (err) {
      console.error('Failed to fetch job from Supabase:', err);
    }
  }

  return jobs.get(id);
}

export async function getJobRecords(id: string): Promise<Record<string, string>[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('raw_records')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Supabase error fetching job records:', error);
      } else if (data && data.raw_records) {
        return data.raw_records as Record<string, string>[];
      }
    } catch (err) {
      console.error('Failed to fetch job records from Supabase:', err);
    }
  }

  return jobRecords.get(id) || [];
}

export async function updateJob(id: string, updates: Partial<ImportJob>): Promise<ImportJob | undefined> {
  // Update in-memory cache first
  const cachedJob = jobs.get(id);
  let updated: ImportJob | undefined;
  if (cachedJob) {
    updated = { ...cachedJob, ...updates };
    jobs.set(id, updated);
  }

  if (supabase) {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName;
      if (updates.totalRecords !== undefined) dbUpdates.total_records = updates.totalRecords;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.fieldMappings !== undefined) dbUpdates.field_mappings = updates.fieldMappings;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.error !== undefined) dbUpdates.error = updates.error;
      if (updates.results !== undefined) dbUpdates.results = updates.results;
      if (updates.skipped !== undefined) dbUpdates.skipped = updates.skipped;

      const { error } = await supabase
        .from('import_jobs')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating job:', error);
      }
    } catch (err) {
      console.error('Failed to update job in Supabase:', err);
    }
  }

  return updated;
}

export async function updateJobProgress(id: string, progress: Partial<BatchProgress>): Promise<ImportJob | undefined> {
  const cachedJob = jobs.get(id);
  if (cachedJob) {
    cachedJob.progress = { ...cachedJob.progress, ...progress };
    jobs.set(id, cachedJob);
  }

  const job = await getJob(id);
  if (job) {
    const updatedProgress = { ...job.progress, ...progress };
    if (supabase) {
      try {
        await supabase
          .from('import_jobs')
          .update({ progress: updatedProgress })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to update job progress in Supabase:', err);
      }
    }
    job.progress = updatedProgress;
    return job;
  }

  return cachedJob;
}

export async function addJobResults(id: string, results: ProcessedRecord[]): Promise<void> {
  // Update memory store
  const cachedJob = jobs.get(id);
  if (cachedJob) {
    const successful = results.filter(r => r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    cachedJob.results.push(...successful);
    cachedJob.skipped.push(...skipped);
    cachedJob.progress.successfulRecords = cachedJob.results.length;
    cachedJob.progress.skippedRecords = cachedJob.skipped.length;
    jobs.set(id, cachedJob);
  }

  const job = await getJob(id);
  if (job) {
    const successful = results.filter(r => r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    const newResults = [...(job.results || []), ...successful];
    const newSkipped = [...(job.skipped || []), ...skipped];
    const updatedProgress = {
      ...job.progress,
      successfulRecords: newResults.length,
      skippedRecords: newSkipped.length,
    };

    if (supabase) {
      try {
        await supabase
          .from('import_jobs')
          .update({
            results: newResults,
            skipped: newSkipped,
            progress: updatedProgress,
          })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to add job results in Supabase:', err);
      }
    }
  }
}

export async function setJobMappings(id: string, mappings: FieldMapping[]): Promise<void> {
  // Update memory store
  const cachedJob = jobs.get(id);
  if (cachedJob) {
    cachedJob.fieldMappings = mappings;
    cachedJob.progress.fieldMappings = mappings;
    jobs.set(id, cachedJob);
  }

  const job = await getJob(id);
  if (job) {
    const updatedProgress = {
      ...job.progress,
      fieldMappings: mappings,
    };

    if (supabase) {
      try {
        await supabase
          .from('import_jobs')
          .update({
            field_mappings: mappings,
            progress: updatedProgress,
          })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to set job mappings in Supabase:', err);
      }
    }
  }
}

export async function deleteJob(id: string): Promise<void> {
  jobs.delete(id);
  jobRecords.delete(id);

  if (supabase) {
    try {
      await supabase.from('import_jobs').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete job from Supabase:', err);
    }
  }
}
