'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { checkDisplayName } from '@/lib/presentation';
import {
  STATUS_LABEL,
  checkStatus,
  noun,
  outcomeSentence,
  populationCounts,
  samplingNote,
} from '@/lib/assessment-view';
import { evidenceRecordUrl } from '@/lib/evidence-source';
import RecordTable from './RecordTable';
import type { CheckResult, ControlSummary, EvidenceColumn, EvidenceRow } from '@/lib/types';

/**
 * One check, its four populations, and the records behind them.
 *
 * THE COUNTS COME FROM THE ASSESSMENT; THE RECORDS COME FROM THE CHECK.
 * `ControlSummary` is already on the page and carries every total, so a count
 * is never waiting on a request. The record lists live on the full
 * `CheckResult`, which is fetched once per check the first time a reader opens
 * any of its populations - the same endpoint the finding page uses, so no
 * second way of reading the org exists.
 *
 * Nothing here re-decides anything. A record appears under Passed because the
 * detector put it there, not because this component compared it to a rule.
 */

type PopulationKey = 'checked' | 'passed' | 'failed' | 'noResult' | 'notApplicable';

const NUM = new Intl.NumberFormat('en-US');

/** Column labels, fixed so all eleven checks read the same way. */
const POPULATION_LABEL: Record<PopulationKey, string> = {
  checked: 'Checked',
  passed: 'Passed',
  failed: 'Failed',
  noResult: 'Undetermined',
  notApplicable: 'Not claimed',
};

/** What each population means, said once, where it is opened. */
const POPULATION_MEANING: Record<PopulationKey, string> = {
  checked: 'Every record this control was able to judge.',
  passed: 'Judged records that met the control.',
  failed: 'Judged records that did not meet it. These are what a finding is built from.',
  noResult:
    'Records this control applies to, where Salesforce does not hold enough evidence to reach a pass or a failure.',
  notApplicable:
    'Records that make no claim at this milestone, so there is nothing for the control to substantiate. Not a pass and not a failure.',
};

export default function CheckRow({
  control,
  instanceHost,
  /**
   * Replaces the generic outcome sentence.
   *
   * Only the cross-stage control uses it: its result is a statement about the
   * transitions between milestones, which the generic sentence cannot make.
   */
  outcome,
}: {
  control: ControlSummary;
  instanceHost?: string;
  outcome?: string;
}) {
  const panelId = useId();
  const name = checkDisplayName(control.id);
  const counts = populationCounts(control);
  const status = checkStatus(control);
  const detailHref = `/findings/${control.id}?from=assessment`;

  const [open, setOpen] = useState<PopulationKey | null>(null);
  const [detail, setDetail] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle(key: PopulationKey) {
    if (open === key) {
      setOpen(null);
      return;
    }
    setOpen(key);
    if (detail || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/findings/${control.id}`);
      if (!res.ok) throw new Error('not ok');
      setDetail((await res.json()) as CheckResult);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const cell = (key: PopulationKey, value: number, tone?: 'bad') => {
    const label = `${POPULATION_LABEL[key]}, ${NUM.format(value)} ${noun(
      control.orgPopulationNoun,
      value,
    )}, for ${name}`;
    if (value === 0) {
      return (
        <td className="pop-cell">
          <span className="pop-zero">0</span>
        </td>
      );
    }
    return (
      <td className="pop-cell">
        <button
          type="button"
          className={`pop-open${tone === 'bad' ? ' bad' : ''}${open === key ? ' is-open' : ''}`}
          aria-expanded={open === key}
          aria-controls={panelId}
          aria-label={label}
          onClick={() => toggle(key)}
        >
          {NUM.format(value)}
        </button>
      </td>
    );
  };

  return (
    <>
      <tr className={`check-row status-${status}`}>
        <th scope="row" className="check-cell">
          <span className="check-head">
            {/*
             * The related-check control in the stage panel moves focus here, so
             * the name carries the anchor rather than the row: a reader arrives
             * on something that can hold focus and announce itself.
             */}
            <Link className="check-name" id={`oc-check-${control.id}`} href={detailHref}>
              {name}
            </Link>
            <span className={`check-status is-${status}`}>
              <span className="check-status-mark" aria-hidden="true" />
              {STATUS_LABEL[status]}
            </span>
          </span>
          {/* The outcome in words, from this control's own numbers. */}
          <span className="check-outcome">{outcome ?? outcomeSentence(control)}</span>
        </th>
        {cell('checked', counts.checked)}
        {cell('passed', counts.passed)}
        {cell('failed', counts.failed, 'bad')}
        {cell('noResult', counts.noResult)}
        {/*
         * The population boundary, in the row it belongs to rather than in a
         * list underneath the table. Checked + Undetermined + Not claimed is
         * the whole set of records this control started from.
         */}
        {cell('notApplicable', counts.notApplicable)}
        <td className="action-cell">
          {status === 'failed' ? (
            <Link className="check-act is-primary" href={detailHref}>
              View related issue<span aria-hidden="true"> →</span>
              <span className="sr-only"> for {name}</span>
            </Link>
          ) : status === 'no-result' ? (
            /*
             * Not a link: the answer is the records themselves, and this check
             * has no finding to open. The button opens the No result list in
             * this row, which names each record and the reason it gave.
             */
            <button
              type="button"
              className="check-act"
              aria-expanded={open === 'noResult'}
              aria-controls={panelId}
              onClick={() => toggle('noResult')}
            >
              Why undetermined?<span className="sr-only"> for {name}</span>
            </button>
          ) : (
            <Link className="check-act" href={detailHref}>
              View details<span className="sr-only"> for {name}</span>
            </Link>
          )}
        </td>
      </tr>

      {open ? (
        <tr className="check-panel-row">
          <td colSpan={7}>
            <div className="pop-panel" id={panelId}>
              {/*
               * The panel names which population, of which check, and how many
               * records it stands for — so a table read on its own can never be
               * taken for a different one.
               */}
              <div className="pop-panel-head">
                <p className="pop-panel-title">
                  {POPULATION_LABEL[open]} — {name}
                  <span className="pop-panel-count">
                    {NUM.format(counts[open])} {noun(control.orgPopulationNoun, counts[open])}
                  </span>
                </p>
                <p className="pop-panel-meaning">{POPULATION_MEANING[open]}</p>
                <button type="button" className="pop-panel-close" onClick={() => setOpen(null)}>
                  Close
                  <span className="sr-only">
                    {' '}
                    the {POPULATION_LABEL[open]} records for {name}
                  </span>
                </button>
              </div>
              <PopulationBody
                population={open}
                counts={counts}
                detail={detail}
                loading={loading}
                failed={failed}
                instanceHost={instanceHost}
                checkId={control.id}
                objectNoun={control.orgPopulationNoun}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/**
 * The records behind one population, as a named-column table.
 *
 * ONE TABLE COMPONENT, NOT A SECOND ONE. `RecordTable` is what the finding
 * page already uses: it links the record name to Salesforce, shows five rows
 * with the rest one click away, filters per column, and closes its popovers on
 * Escape. A population of fifty is therefore already handled, and no
 * pagination and no library were introduced to handle it.
 *
 * The columns are the check's own wherever the check has them. Only the
 * checked and passing lists need columns built here, because those are the two
 * populations the detector retains as record references rather than as
 * evidence rows.
 */
function PopulationBody({
  population,
  counts,
  detail,
  loading,
  failed,
  instanceHost,
  checkId,
  objectNoun,
}: {
  population: PopulationKey;
  counts: ReturnType<typeof populationCounts>;
  detail: CheckResult | null;
  loading: boolean;
  failed: boolean;
  instanceHost?: string;
  checkId: ControlSummary['id'];
  objectNoun: string;
}) {
  if (loading) return <p className="pop-status">Reading the records…</p>;
  if (failed) {
    return (
      <p className="pop-status">
        The records could not be read. The counts above come from the assessment and are unaffected.
      </p>
    );
  }
  if (!detail) return null;

  const view = populationView(population, detail, objectNoun);
  if (view === null) return <p className="pop-status">No records retained for this list.</p>;

  return (
    <>
      <Note text={samplingNote(view.rows.length, counts[population])} />
      <RecordTable
        columns={view.columns}
        rows={view.rows}
        hrefs={view.rows.map((r) => evidenceRecordUrl(detail.source, instanceHost, String(r.Id ?? '')))}
        label={`${POPULATION_LABEL[population].toLowerCase()} records`}
      />
      {population === 'failed' ? (
        <p className="pop-onward">
          <Link href={`/findings/${checkId}`}>
            Investigate this finding — evidence, source and safeguard →
          </Link>
        </p>
      ) : null}
    </>
  );
}

/**
 * Which columns and rows a population is shown with.
 *
 * Failed and the two not-evaluated lists carry the check's own evidence
 * columns, so those are used verbatim — the same columns the finding page
 * shows, from the same payload, so a record cannot read differently in the two
 * places. Checked and passing arrive as record references, so their columns
 * are named here from what a reference holds.
 */
function populationView(
  population: PopulationKey,
  detail: CheckResult,
  objectNoun: string,
): { columns: EvidenceColumn[]; rows: EvidenceRow[] } | null {
  if (population === 'failed') {
    return detail.evidence.length === 0
      ? null
      : { columns: detail.evidenceColumns, rows: detail.evidence };
  }

  if (population === 'noResult' || population === 'notApplicable') {
    const kind = population === 'noResult' ? 'unmeasurable' : 'outside';
    const rows = detail.notEvaluatedRecords.filter((n) => n.kind === kind).map((n) => n.row);
    return rows.length === 0 ? null : { columns: detail.notEvaluatedColumns, rows };
  }

  const sample = population === 'checked' ? detail.checkedSample : detail.passingSample;
  if (sample.records.length === 0) return null;

  const rows: EvidenceRow[] = sample.records.map((r) => ({
    Name: r.label,
    Id: r.id,
    Context: r.context,
    State: r.state,
  }));

  /*
   * A column nothing in the list can fill is not shown. A whole column of
   * em-dashes reads as missing data rather than as a field this object never
   * had.
   */
  const singular = noun(objectNoun, 1);
  const isLead = singular === 'Lead';
  const columns: EvidenceColumn[] = [
    { key: 'Name', label: singular },
    { key: 'Id', label: 'Record ID', mono: true },
  ];
  if (rows.some((r) => r.Context !== null)) {
    columns.push({ key: 'Context', label: isLead ? 'Company' : 'Account' });
  }
  if (rows.some((r) => r.State !== null)) {
    columns.push({ key: 'State', label: isLead ? 'Lead Status' : 'Stage' });
  }
  return { columns, rows };
}

function Note({ text }: { text: string | null }) {
  return text ? <p className="pop-note">{text}</p> : null;
}

export type { EvidenceRow };
