// ============================================================
// POST /api/imports — Create import job
// GET /api/imports — Not used (returns method info)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import { createJob, getJob } from '@/server/store/job-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, records, headers } = body;

    if (!fileName || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, records' },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No records to process' },
        { status: 400 }
      );
    }

    const id = generateId();
    const job = await createJob(id, fileName, records);

    return NextResponse.json({
      id: job.id,
      status: job.status,
      totalRecords: job.totalRecords,
      message: 'Import job created. Call POST /api/imports/{id}/process to begin AI processing.',
    });
  } catch (error) {
    console.error('Error creating import job:', error);
    return NextResponse.json(
      { error: 'Failed to create import job' },
      { status: 500 }
    );
  }
}
