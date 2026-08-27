import { recordUrl } from '@/lib/salesforce';
import RecordTable from './RecordTable';
import type { EvidenceColumn, EvidenceRow } from '@/lib/types';

/**
 * INVESTIGATE. Raw Salesforce field values, unedited.
 *
 * Only the fields a check reasons over are shown. No Contact email or phone,
 * and no field the finding does not need - the evidence should be sufficient
 * to act on and no broader than that.
 *
 * The server resolves each record's Salesforce URL here, because `recordUrl`
 * sits behind the `server-only` boundary. Rendering, filtering and the actions
 * menu happen in `RecordTable`, a Client Component that never sees the
 * instance host.
 */
export default function EvidenceTable({
  columns,
  rows,
  instanceHost,
  label,
  exportBase,
}: {
  columns: EvidenceColumn[];
  rows: EvidenceRow[];
  /** When known, the record's name becomes a deep link into the connected org. */
  instanceHost?: string;
  /** Names what is being filtered, for the filter input's accessible label. */
  label: string;
  /** Export route for this table. Omitted where the table has no export. */
  exportBase?: string;
}) {
  return (
    <RecordTable
      columns={columns}
      rows={rows}
      hrefs={rows.map((row) => recordUrl(instanceHost, String(row.Id ?? '')))}
      label={label}
      exportBase={exportBase}
    />
  );
}
