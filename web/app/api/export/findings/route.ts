import { runAssessment } from '@/lib/assessment';
import { toSafeError } from '@/lib/salesforce';
import { findingsExport } from '@/lib/export-model';
import { exportFilename, exportHeaders, isExportFormat, toCsv, toXlsx } from '@/lib/export';

/**
 * Findings export.
 *
 * Reads the org, scores it, and returns the same dataset the Findings screen
 * presents — plus the run metadata and the substantiated Where Used rows, so
 * the file still says what it describes once it is open somewhere else.
 *
 * GET rather than POST because a download is a navigation, and the route
 * performs no write of any kind. `no-store` keeps a point-in-time observation
 * from being replayed from a cache.
 */
export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = {
  NOT_CONFIGURED: 409,
  AUTH_FAILED: 502,
  API_ERROR: 502,
  NETWORK_ERROR: 504,
  UNKNOWN: 500,
};

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get('format');
  if (!isExportFormat(format)) {
    return Response.json(
      { error: { code: 'BAD_REQUEST', message: 'Supported formats are csv and xlsx.' } },
      { status: 400 },
    );
  }

  try {
    const result = await runAssessment(new Date());
    const sheets = findingsExport(result);
    const filename = exportFilename('northstariq-findings', result.ranAt, format);
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
