'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AssessmentResult, SafeError } from '@/lib/types';
import ScoreMeter from './ScoreMeter';
import FindingCard from './FindingCard';
import Notice from './Notice';

type State =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'error'; error: SafeError }
  | { phase: 'done'; result: AssessmentResult };

/**
 * ASSESS, as an explicit act.
 *
 * The run is deliberately user-initiated rather than automatic: an assessment
 * is a claim about the org at a moment in time, so the moment should be one
 * the reader chose. Every run reads live - nothing is cached between runs.
 */
export default function AssessmentPanel() {
  const [state, setState] = useState<State>({ phase: 'idle' });

  async function run() {
    setState({ phase: 'running' });
    try {
      const res = await fetch('/api/assessment/run', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        setState({ phase: 'error', error: body.error as SafeError });
        return;
      }
      setState({ phase: 'done', result: body as AssessmentResult });
    } catch {
      setState({
        phase: 'error',
        error: { code: 'NETWORK_ERROR', message: 'The assessment request could not be sent.' },
      });
    }
  }

  if (state.phase === 'idle' || state.phase === 'running') {
    return (
      <div className="card">
        <div className="row-between">
          <div>
            <h2>Run an assessment</h2>
            <p className="muted" style={{ margin: 0, maxWidth: '62ch' }}>
              Reads Leads and Opportunities from the connected org, applies six checks and scores
              five categories. Read-only: no record is created, updated or deleted.
            </p>
          </div>
          <button className="primary" onClick={run} disabled={state.phase === 'running'}>
            {state.phase === 'running' ? 'Assessing…' : 'Run assessment'}
          </button>
        </div>
        {state.phase === 'running' ? (
          <p className="footnote">Querying Salesforce and evaluating checks…</p>
        ) : null}
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="stack">
        <Notice tone="error" title="The assessment could not be completed">
          {state.error.message} No partial or estimated result is shown — an assessment either read
          the org or it did not.
        </Notice>
        <div>
          <button className="primary" onClick={run}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { result } = state;

  return (
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Revenue Operations Health</p>
            <div className="health">
              <span className="health-value">{result.overallHealth}</span>
              <span className="health-scale">/ 100</span>
            </div>
            <p className="footnote" style={{ marginTop: 8 }}>
              Mean of the five category scores. Assessed {result.recordsAssessed} records across{' '}
              {result.objectsAssessed.join(' and ')} at {formatTime(result.ranAt)}.
            </p>
          </div>
          <button className="primary" onClick={run}>
            Re-run
          </button>
        </div>
      </div>

      <div className="grid-categories">
        {result.categoryScores.map((c) => (
          <div className="category" key={c.category}>
            <div className="stat-label">{c.category}</div>
            <div className="category-score">{c.score}</div>
            <ScoreMeter score={c.score} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="grid-meta">
          <div>
            <div className="stat-label">Findings</div>
            <div className="stat-value">{result.findingCount}</div>
          </div>
          <div>
            <div className="stat-label">High severity</div>
            <div
              className="stat-value"
              style={result.highSeverityCount > 0 ? { color: 'var(--high)' } : undefined}
            >
              {result.highSeverityCount}
            </div>
          </div>
          <div>
            <div className="stat-label">Records assessed</div>
            <div className="stat-value">{result.recordsAssessed}</div>
          </div>
          <div>
            <div className="stat-label">Checks run</div>
            <div className="stat-value">6</div>
          </div>
        </div>
      </div>

      {result.findings.length === 0 ? (
        <Notice tone="ok" title="No findings">
          Every check passed against the current org. Checks that find nothing are not reported as
          findings — the engine reports what it finds rather than manufacturing work.
        </Notice>
      ) : (
        <div className="stack">
          <div className="row-between">
            <h2 style={{ margin: 0 }}>Top findings</h2>
            <Link href="/findings">View all findings →</Link>
          </div>
          {result.findings.slice(0, 3).map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}
