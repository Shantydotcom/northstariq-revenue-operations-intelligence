import { recordUrl } from '@/lib/salesforce';
import type { EvidenceColumn, EvidenceRow } from '@/lib/types';

/**
 * INVESTIGATE. Raw Salesforce field values, unedited.
 *
 * Only the fields a check reasons over are shown. No Contact email or phone,
 * and no field the finding does not need - the evidence should be sufficient
 * to act on and no broader than that.
 */
export default function EvidenceTable({
  columns,
  rows,
  instanceHost,
}: {
  columns: EvidenceColumn[];
  rows: EvidenceRow[];
  /** When known, the record's name becomes a deep link into the connected org. */
  instanceHost?: string;
}) {
  if (rows.length === 0) {
    return <div className="empty">No records to show.</div>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            // One link per row, on the name a reader recognises. The Id stays
            // visible as text because it is the value Salesforce actually holds,
            // but an 18-character key is not something to ask anyone to click.
            const href = recordUrl(instanceHost, String(row.Id ?? ''));
            return (
              <tr key={String(row.Id ?? i)}>
                {columns.map((c) => {
                  const value = row[c.key];
                  const display = value === null || value === '' ? '—' : String(value);
                  const linked = href !== null && c.key === 'Name';
                  return (
                    <td key={c.key} className={c.mono ? 'mono' : undefined}>
                      {linked ? (
                        <a className="record-link" href={href} target="_blank" rel="noreferrer">
                          {display}
                          <span aria-hidden="true"> ↗</span>
                          <span className="sr-only"> (opens in Salesforce)</span>
                        </a>
                      ) : (
                        display
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
