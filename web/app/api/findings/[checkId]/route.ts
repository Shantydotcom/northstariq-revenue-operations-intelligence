import { NextResponse } from 'next/server';
import { runCheck } from '@/lib/assessment';
import { isCheckId } from '@/lib/checks';
import { toSafeError } from '@/lib/salesforce';

/**
 * Evidence for one check.
 *
 * The path segment is validated against the CheckId union before use. It never
 * reaches SOQL - queries are static literals - but an unknown id is a 404
 * rather than an empty result, so a typo is visible instead of silent.
 */
export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = {
  NOT_CONFIGURED: 409,
  AUTH_FAILED: 502,
  API_ERROR: 502,
  NETWORK_ERROR: 504,
  UNKNOWN: 500,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ checkId: string }> },
) {
  const { checkId } = await params;

  if (!isCheckId(checkId)) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown check.' } }, { status: 404 });
  }

  try {
    const result = await runCheck(checkId, new Date());
    if (!result) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Unknown check.' } }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const safe = toSafeError(err);
    return NextResponse.json({ error: safe }, { status: STATUS[safe.code] ?? 500 });
  }
}
