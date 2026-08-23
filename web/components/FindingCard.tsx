import Link from 'next/link';
import type { FindingSummary } from '@/lib/types';

/** FIND. Each card leads to INVESTIGATE — the evidence behind the count. */
export default function FindingCard({ finding }: { finding: FindingSummary }) {
  return (
    <Link className="finding" href={`/findings/${finding.id}`}>
      <div className="row-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className={`badge ${finding.severity}`}>{finding.severity}</span>
            <span className="stat-label">{finding.category}</span>
          </div>
          <h3>{finding.title}</h3>
        </div>
        <div className="affected">
          <strong>{finding.affected}</strong> affected
        </div>
      </div>
      <p>{finding.businessImpact}</p>
    </Link>
  );
}
