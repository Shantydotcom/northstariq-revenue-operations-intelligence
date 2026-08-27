import { runCheck } from '@/lib/assessment';
import { isCheckId } from '@/lib/checks';
import { getStatus, toSafeError } from '@/lib/salesforce';
import { notEvaluatedExport } from '@/lib/export-model';
import { exportFilename, exportHeaders, isExportFormat, toCsv, toXlsx } from '@/lib/export';

/**
 * Records-not-evaluated export for one check.
 *
 * Same shape and same guards as the evidence export: the check id is validated
 * against the CheckId union before use, so an unknown id is a 404 rather than
 * an empty file.
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
  request: Request,
  { params }: { params: Promise<{ checkId: string }> },
) {
  const { checkId } = await params;
  const format = new URL(request.url).searchParams.get('format');

  if (!isCheckId(checkId)) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Unknown check.' } },
      { status: 404 },
    );
  }
  if (!isExportFormat(format)) {
    return Response.json(
      { error: { code: 'BAD_REQUEST', message: 'Supported formats are csv and xlsx.' } },
      { status: 400 },
    );
  }

  const observedAt = new Date();

  try {
    const [check, status] = await Promise.all([runCheck(checkId, observedAt), getStatus()]);
    if (!check) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Unknown check.' } },
        { status: 404 },
      );
    }

    const sheets = notEvaluatedExport(check, observedAt.toISOString(), status.instanceHost);
    const filename = exportFilename(
      `northstariq-not-evaluated-${checkId}`,
      observedAt.toISOString(),
      format,
    );
    const headers = exportHeaders(filename, format);

    if (format === 'xlsx') {
      return new Response(new Uint8Array(toXlsx(sheets)), { headers });
    }
    return new Response(toCsv(sheets), { headers });
  } catch (err) {
    const safe = toSafeError(err);
    return Response.json({ error: safe }, { status: STATUS[safe.code] ?? 500 });
  }
}
