// ============================================================
// POST /api/imports/[id]/process — Begin AI processing
// GET /api/imports/[id]/process — SSE stream for progress
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getJob, getJobRecords, updateJob, updateJobProgress, addJobResults, setJobMappings } from '@/server/store/job-store';
import { inferFieldMappings, processBatch, BATCH_SIZE } from '@/server/services/ai-service';

// Store SSE controllers per job
const sseControllers = new Map<string, ReadableStreamDefaultController[]>();

function notifySSE(jobId: string, event: string, data: unknown) {
  const controllers = sseControllers.get(jobId) || [];
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const controller of controllers) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      // Controller closed
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status !== 'queued') {
    return NextResponse.json({ error: 'Job already processing or completed' }, { status: 400 });
  }

  const records = await getJobRecords(id);
  if (!records.length) {
    return NextResponse.json({ error: 'No records found' }, { status: 400 });
  }

  // Start processing in background
  processJobAsync(id, records).catch(err => {
    console.error('Processing failed:', err);
    updateJob(id, { status: 'failed', error: err.message });
  });

  await updateJob(id, { status: 'parsing' });

  return NextResponse.json({
    message: 'Processing started',
    status: 'parsing',
    sseEndpoint: `/api/imports/${id}/process`,
  });
}

async function processJobAsync(jobId: string, records: Record<string, string>[]) {
  const headers = Object.keys(records[0] || {});

  // Phase 1: Schema Inference
  await updateJobProgress(jobId, { currentPhase: 'Reading structure' });
  notifySSE(jobId, 'progress', { phase: 'Reading structure', detail: 'Analyzing column headers' });
  await new Promise(r => setTimeout(r, 600));

  await updateJobProgress(jobId, { currentPhase: 'Detecting columns' });
  notifySSE(jobId, 'progress', { phase: 'Detecting columns', detail: 'Understanding field relationships' });
  await new Promise(r => setTimeout(r, 800));

  // Infer mappings
  const mappings = await inferFieldMappings(headers, records.slice(0, 5));
  await setJobMappings(jobId, mappings);

  await updateJob(jobId, { status: 'mapping' });
  await updateJobProgress(jobId, { currentPhase: 'Mapping CRM properties' });
  notifySSE(jobId, 'mapping', { mappings, phase: 'Mapping CRM properties' });
  await new Promise(r => setTimeout(r, 1000));

  // Phase 2: Batch Processing
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);
  await updateJob(jobId, { status: 'validating' });
  await updateJobProgress(jobId, {
    totalBatches,
    currentPhase: 'Processing records',
  });

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const batchRows = records.slice(start, start + BATCH_SIZE);
    const batchNum = i + 1;

    await updateJobProgress(jobId, {
      currentBatch: batchNum,
      currentPhase: `Processing batch ${batchNum} of ${totalBatches}`,
    });

    notifySSE(jobId, 'progress', {
      phase: `Processing batch ${batchNum} of ${totalBatches}`,
      detail: `Analyzing records ${start + 1}–${Math.min(start + BATCH_SIZE, records.length)}`,
      currentBatch: batchNum,
      totalBatches,
      processedRecords: start,
      totalRecords: records.length,
    });

    let result;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        result = await processBatch(batchRows, mappings, start, i);
        break;
      } catch (error) {
        retries++;
        const currentJob = await getJob(jobId);
        if (retries > maxRetries) {
          await updateJobProgress(jobId, {
            failedBatches: (currentJob?.progress.failedBatches || 0) + 1,
          });
          notifySSE(jobId, 'error', {
            message: `Batch ${batchNum} failed permanently after ${maxRetries} retries`,
            batch: batchNum,
          });
          continue;
        }

        await updateJobProgress(jobId, {
          retriedBatches: (currentJob?.progress.retriedBatches || 0) + 1,
          currentPhase: `Retrying batch ${batchNum} — attempt ${retries + 1} of ${maxRetries}`,
        });
        notifySSE(jobId, 'retry', {
          batch: batchNum,
          attempt: retries + 1,
          maxRetries,
        });

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, retries) + Math.random() * 500, 8000);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    if (result) {
      await addJobResults(jobId, result.records);
      await updateJobProgress(jobId, {
        processedRecords: Math.min(start + BATCH_SIZE, records.length),
      });

      notifySSE(jobId, 'batch_complete', {
        batch: batchNum,
        totalBatches,
        processedRecords: Math.min(start + BATCH_SIZE, records.length),
        totalRecords: records.length,
        batchSuccessful: result.records.filter(r => r.status === 'success').length,
        batchSkipped: result.records.filter(r => r.status === 'skipped').length,
      });
    }
  }

  // Phase 3: Completion
  const finalJob = await getJob(jobId);
  const hasFailures = (finalJob?.progress.failedBatches || 0) > 0;

  await updateJob(jobId, {
    status: hasFailures ? 'completed_with_warnings' : 'completed',
    completedAt: new Date().toISOString(),
  });

  await updateJobProgress(jobId, {
    currentPhase: 'Complete',
    processedRecords: records.length,
  });

  notifySSE(jobId, 'complete', {
    status: hasFailures ? 'completed_with_warnings' : 'completed',
    totalRecords: records.length,
    successfulRecords: finalJob?.results.length || 0,
    skippedRecords: finalJob?.skipped.length || 0,
    fieldMappings: finalJob?.fieldMappings || [],
  });
}

// SSE endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const controllers = sseControllers.get(id) || [];
      controllers.push(controller);
      sseControllers.set(id, controllers);

      // Send initial state
      const initMessage = `event: init\ndata: ${JSON.stringify({
        status: job.status,
        progress: job.progress,
        fieldMappings: job.fieldMappings,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));

      // If already complete, send completion
      if (job.status === 'completed' || job.status === 'completed_with_warnings') {
        const completeMsg = `event: complete\ndata: ${JSON.stringify({
          status: job.status,
          totalRecords: job.totalRecords,
          successfulRecords: job.results.length,
          skippedRecords: job.skipped.length,
          fieldMappings: job.fieldMappings,
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(completeMsg));
      }

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        const ctrls = sseControllers.get(id) || [];
        sseControllers.set(id, ctrls.filter(c => c !== controller));
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
