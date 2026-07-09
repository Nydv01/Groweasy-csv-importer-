// ============================================================
// GET /api/imports/[id]/skipped — Get skipped records
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
    totalRecords: job.totalRecords,
    skippedRecords: job.skipped.length,
    records: job.skipped,
  });
}
