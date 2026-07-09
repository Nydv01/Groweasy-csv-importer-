// ============================================================
// GET /api/imports/[id] — Get job status
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/server/store/job-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    fileName: job.fileName,
    totalRecords: job.totalRecords,
    progress: job.progress,
    fieldMappings: job.fieldMappings,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
  });
}
