import Link from 'next/link';
import { AREAS, PRESENTATION, findingPopulation } from '@/lib/presentation';
import type { FindingSummary } from '@/lib/types';

/**
 * One row of the investigation queue.
 *
 * TRIAGE, not investigation: priority, what failed, where in the revenue
 * process it sits, and how large the affected population is. Why it matters,
 * what safeguard exists and which records are involved all live one click
 * away, on the finding itself.
 *
 * The whole row is the link. Priority is a word before it is a colour, so the
 * queue is still readable without colour.
 */
export default function FindingRow({ finding }: { finding: FindingSummary }) {
  const p = PRESENTATION[finding.id];
  const area = AREAS[finding.category];

  return (
    <Link className="queue-row" href={`/findings/${finding.id}`}>
      <span className={`queue-priority ${finding.severity}`}>
        {finding.severity === 'High' ? 'High' : finding.severity}
      </span>

      <span className="queue-main">
        <span className="queue-name">{p.label}</span>
        <span className="queue-area">{area.label}</span>
        <span className="queue-desc">{p.queueDescription}</span>
      </span>

      <span className="queue-population">
        {findingPopulation(p, finding.affected, finding.evaluated)}
      </span>

      <span className="queue-go" aria-hidden="true">
        View finding →
      </span>
    </Link>
  );
}
