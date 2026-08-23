import { NextResponse } from 'next/server';
import { runAssessment } from '@/lib/assessment';
import { toSafeError } from '@/lib/salesforce';

/**
 * Run an assessment against the live org.
 *
 * POST because it is an explicit user action, not a cacheable read - the
 * CONNECT -> ASSESS step in the product story. It still performs no writes.
 */
export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = {
  NOT_CONFIGURED: 409,
  AUTH_FAILED: 502,
  API_ERROR: 502,
  NETWORK_ERROR: 504,
  UNKNOWN: 500,
};

export async function POST() {
  try {
    return NextResponse.json(await runAssessment(new Date()));
  } catch (err) {
    const safe = toSafeError(err);
    return NextResponse.json({ error: safe }, { status: STATUS[safe.code] ?? 500 });
  }
}
