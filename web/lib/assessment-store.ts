'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AssessmentResult, SafeError } from './types';

/**
 * THE ONE COMPLETED ASSESSMENT, SHARED BY EVERY PAGE THAT NEEDS IT.
 *
 * Dashboard and Assessment are two routes describing the same run, so the
 * result cannot belong to either component. It was private to
 * `AssessmentPanel`; this lifts it out unchanged - same key, same shape guard,
 * same `sessionStorage`, same request - so both pages read one result and a run
 * started on either is visible on the other.
 *
 * Nothing persists beyond the tab: no database, no account, no server-side
 * store, nothing shared between visitors. Restoring is honest because the
 * result carries its own observation time and every page that shows it also
 * shows that time - a restored assessment states the moment it was read,
 * exactly as a fresh one does. Nothing is recomputed and no number is invented;
 * this is the same payload the org returned.
 */

/*
 * VERSIONED WITH THE PAYLOAD SHAPE. v2 added per-control populations; v4 adds
 * the exclusion causes each control recorded. An entry left in a tab from
 * before a shape change must not be restored into a UI that reads the new
 * fields, so the key moves every time the shape does.
 */
const RESULT_KEY = 'northstariq.assessment.v4';

export function readStoredResult(): AssessmentResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentResult;
    // Shape guard: a stale or hand-edited entry must not render as a result.
    if (
      typeof parsed?.ranAt !== 'string' ||
      typeof parsed?.overallHealth !== 'number' ||
      !Array.isArray(parsed?.categoryScores) ||
      !Array.isArray(parsed?.findings) ||
      // Every field a page reads has to be guarded, not just most of them: a
      // payload missing one renders as a client-side crash, not as a missing
      // number.
      !Array.isArray(parsed?.controls) ||
      parsed.controls.some((c) => !Array.isArray(c?.exclusionBreakdown))
    ) {
      return null;
    }
    return parsed;
  } catch {
    // Private mode, disabled storage, or malformed JSON: start unassessed.
    return null;
  }
}

export function storeResult(result: AssessmentResult): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // Storage being unavailable must never break an assessment that succeeded.
  }
}

export interface AssessmentRun {
  /**
   * The last assessment that actually completed, kept across a re-run and
   * across a failure. A result that was true a moment ago is not made false by
   * a later request failing, and discarding it costs the reader the evidence
   * they were in the middle of reading.
   */
  result: AssessmentResult | null;
  /**
   * Whether the store has finished looking for a stored result.
   *
   * `result === null` means two different things, and the pages were reading
   * them as one. Before restoration it means "not looked yet"; after it, "there
   * is none". The server renders with `restored === false` because it genuinely
   * cannot know - it has no session storage - and the client answers the
   * question in the effect below.
   *
   * Without this every load of a tab holding a result painted the first-run
   * experience and then replaced it: the application asserted "no assessment"
   * before it had any basis for saying so.
   */
  restored: boolean;
  running: boolean;
  error: SafeError | null;
  /** Resolves to the completed result, or null when the run failed. */
  run: () => Promise<AssessmentResult | null>;
}

/**
 * Running an assessment, and holding the one that completed.
 *
 * The run is deliberately user-initiated rather than automatic: an assessment
 * is a claim about the org at a moment in time, so the moment should be one the
 * reader chose. Every run reads live - nothing is cached between runs.
 */
export function useAssessmentRun(connected: boolean): AssessmentRun {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [restored, setRestored] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<SafeError | null>(null);

  /*
   * Restore after mount, never during render: the server has no session
   * storage, so reading it while rendering would produce markup the client
   * could not match. Starting empty and filling in on the client keeps
   * hydration clean.
   *
   * `restored` is set whichever way the answer comes out - including when
   * there is no connection to have a result for - so the flag means "the
   * question has been answered", never "the answer was yes".
   */
  useEffect(() => {
    if (connected) {
      const stored = readStoredResult();
      if (stored) setResult(stored);
    }
    setRestored(true);
  }, [connected]);

  const run = useCallback(async (): Promise<AssessmentResult | null> => {
    if (running) return null; // guards a double submit while a request is in flight
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/assessment/run', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error as SafeError);
        return null;
      }
      const next = body as AssessmentResult;
      setResult(next);
      storeResult(next);
      return next;
    } catch {
      setError({ code: 'NETWORK_ERROR', message: 'The assessment request could not be sent.' });
      return null;
    } finally {
      setRunning(false);
    }
  }, [running]);

  return { result, restored, running, error, run };
}
