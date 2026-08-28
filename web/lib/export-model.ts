import 'server-only';

import type { AssessmentResult, CheckResult } from './types.ts';
import { AREAS, PRESENTATION, formatObservedAt } from './presentation.ts';
import { TRACEABILITY, ABSENT_TYPES } from './traceability.ts';
import { recordUrl } from './salesforce.ts';
import type { Sheet } from './export.ts';

/**
 * The shape of an export.
 *
 * Exports carry the dataset the screen presents, with the operational context
 * a reader needs once the file is open away from the application: which
 * control produced the row, over which population, and what the number means.
 * Column names are the operator-facing ones, not the internal keys.
 */

const SALESFORCE_OBJECT: Record<string, string> = {
  'missing-firmographics': 'Lead',
  'segment-consistency': 'Lead',
  'routing-exceptions': 'Lead',
  'sla-risk': 'Lead',
  'ambiguous-match': 'Lead',
  'missing-territory': 'Lead',
  'stale-opportunities': 'Opportunity',
  'lifecycle-conversion': 'Lead',
  'mql-integrity': 'Lead',
  'lifecycle-progression': 'Lead',
  'sales-acceptance-sql': 'Lead',
};

const DEPENDENCY_HEADER = [
  'Assessment Control',
  'Salesforce Object',
  'Field',
  'Automation / Configuration',
  'Type',
  'Purpose',
  'Repository Evidence',
];

/**
 * Dependency rows for one or more checks.
 *
 * A check with no established dependency still produces a row, carrying the
 * reason. An empty table would read as "not investigated"; this reads as
 * "investigated, and there is nothing there".
 */
function dependencyRows(checkIds: string[]): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  for (const id of checkIds) {
    const label = PRESENTATION[id as keyof typeof PRESENTATION]?.label ?? id;
    const trace = TRACEABILITY[id as keyof typeof TRACEABILITY];
    if (!trace) continue;

    if (trace.usages.length === 0) {
      rows.push([
        label,
        SALESFORCE_OBJECT[id] ?? '—',
        trace.fields.join(', '),
        'None established',
        '—',
        trace.noneEstablished ?? 'No dependency established.',
        '—',
      ]);
      continue;
    }
    for (const u of trace.usages) {
      rows.push([label, u.object, u.field, u.name, u.type, u.purpose, u.evidencePath]);
    }
  }
  return rows;
}

/** Run metadata, so a file opened later still says what it describes. */
function runSheet(result: AssessmentResult): Sheet {
  return {
    name: 'Assessment',
    header: ['Property', 'Value'],
    rows: [
      ['Observed from Salesforce at', formatObservedAt(result.ranAt)],
      ['Observation timestamp (UTC ISO)', result.ranAt],
      ['Salesforce records assessed', result.recordsAssessed],
      ['Objects assessed', result.objectsAssessed.join(', ')],
      ['Overall health', result.overallHealth],
      ['Assessment areas', result.categoryScores.length],
      ['Findings', result.findingCount],
      ['High priority findings', result.highSeverityCount],
      ['Scoring method', 'Control score = round(100 x (1 - failing / evaluated)). Area = unweighted mean of its controls. Overall health = unweighted mean of areas.'],
      ['Source', 'NorthstarIQ read-only assessment. Salesforce data is synthetic; NorthstarIQ is a fictional company.'],
      ['Limitation', 'A finding reports what the org recorded. It is not a test of the Salesforce automation that produced it.'],
    ],
  };
}

export function findingsExport(result: AssessmentResult): Sheet[] {
  const findings: Sheet = {
    name: 'Findings',
    header: [
      'Assessment Area',
      'Assessment Control',
      'Priority',
      'Salesforce Object',
      'Population Evaluated',
      'Population Description',
      'Records Failing',
      'Control Score',
      'Finding',
      'Business Impact',
      'Why This Control Exists',
    ],
    rows: result.findings.map((f) => {
      const p = PRESENTATION[f.id];
      return [
        AREAS[f.category].label,
        p.label,
        f.severity,
        SALESFORCE_OBJECT[f.id] ?? '—',
        f.evaluated,
        `${f.evaluated} ${p.populationNoun}`,
        f.affected,
        Math.round(100 * (1 - f.affected / (f.evaluated || 1))),
        p.finding(f.affected, f.evaluated),
        f.businessImpact,
        p.why,
      ];
    }),
  };

  const areas: Sheet = {
    name: 'Assessment Areas',
    header: ['Assessment Area', 'Question Answered', 'Controls in Area', 'Area Score'],
    rows: result.categoryScores.map((c) => [
      AREAS[c.category].label,
      AREAS[c.category].question,
      c.checkIds.map((id) => PRESENTATION[id].label).join(', '),
      c.score,
    ]),
  };

  const dependencies: Sheet = {
    name: 'Dependencies',
    header: DEPENDENCY_HEADER,
    rows: [
      ...dependencyRows(result.findings.map((f) => f.id)),
      ['—', '—', '—', ABSENT_TYPES, '—', '—', '—'],
    ],
  };

  return [runSheet(result), findings, areas, dependencies];
}

export function evidenceExport(
  check: CheckResult,
  observedAtIso: string,
  instanceHost: string | undefined,
): Sheet[] {
  const p = PRESENTATION[check.id];
  const object = SALESFORCE_OBJECT[check.id] ?? '—';

  const evidence: Sheet = {
    name: 'Evidence',
    header: [
      'Salesforce Object',
      'Assessment Control',
      ...check.evidenceColumns.map((c) => c.label),
      'Salesforce Record URL',
    ],
    rows: check.evidence.map((row) => [
      object,
      p.label,
      ...check.evidenceColumns.map((c) => {
        const v = row[c.key];
        return v === null || v === undefined ? '' : (v as string | number);
      }),
      recordUrl(instanceHost, String(row.Id ?? '')) ?? '',
    ]),
  };

  const context: Sheet = {
    name: 'Finding',
    header: ['Property', 'Value'],
    rows: [
      ['Assessment Control', p.label],
      ['Canonical check id', check.id],
      ['Assessment Area', AREAS[check.category].label],
      ['Priority', check.severity],
      ['Salesforce Object', object],
      ['Population Evaluated', check.evaluated],
      ['Population Description', check.population],
      ['Records Failing', check.failing],
      ['Control Score', check.score],
      ['Calculation', `round(100 x (1 - ${check.failing} / ${check.evaluated || 1})) = ${check.score}`],
      ['Records in this export', check.evidence.length],
      [
        'Export coverage',
        check.evidence.length < check.failing
          ? `${check.evidence.length} of ${check.failing} failing records. The evidence view is capped, and this export carries the same rows the screen presents.`
          : `All ${check.failing} failing records.`,
      ],
      ['Observed from Salesforce at', formatObservedAt(observedAtIso)],
      ['Observation timestamp (UTC ISO)', observedAtIso],
      ['Limitation', 'A finding reports what the org recorded. It is not a test of the Salesforce automation that produced it.'],
      ['Source', 'NorthstarIQ read-only assessment. Salesforce data is synthetic; NorthstarIQ is a fictional company.'],
    ],
  };

  const dependencies: Sheet = {
    name: 'Dependencies',
    header: DEPENDENCY_HEADER,
    rows: [
      ...dependencyRows([check.id]),
      ['—', '—', '—', ABSENT_TYPES, '—', '—', '—'],
    ],
  };

  return [context, evidence, dependencies];
}

/**
 * Records this control did not evaluate.
 *
 * Exported so an omission can be challenged away from the screen. Each row
 * keeps the reason that record was left out - the reason is the whole point of
 * the file, and it is per record rather than per control.
 */
export function notEvaluatedExport(
  check: CheckResult,
  observedAtIso: string,
  instanceHost: string | undefined,
): Sheet[] {
  const p = PRESENTATION[check.id];
  const object = SALESFORCE_OBJECT[check.id] ?? '—';

  const records: Sheet = {
    name: 'Not Evaluated',
    header: [
      'Salesforce Object',
      'Assessment Control',
      ...check.notEvaluatedColumns.map((c) => c.label),
      'Salesforce Record URL',
    ],
    rows: check.notEvaluatedRows.map((row) => [
      object,
      p.label,
      ...check.notEvaluatedColumns.map((c) => {
        const v = row[c.key];
        return v === null || v === undefined ? '' : (v as string | number);
      }),
      recordUrl(instanceHost, String(row.Id ?? '')) ?? '',
    ]),
  };

  const context: Sheet = {
    name: 'Control',
    header: ['Property', 'Value'],
    rows: [
      ['Assessment Control', p.label],
      ['Assessment Area', AREAS[check.category].label],
      ['Salesforce Object', object],
      [`${check.orgPopulationNoun} found`, check.orgPopulation],
      ['Evaluated by this control', check.evaluated],
      ['Not evaluated', check.notEvaluatedCount],
      ['Of those, unmeasurable', check.unmeasurableCount],
      ['Records failing', check.failing],
      ['Control Score', check.score],
      [
        'What this file contains',
        'The records this control did not evaluate, each with the reason it was left out. They are not counted as passing and did not contribute to the score.',
      ],
      [
        'Unmeasurable',
        'A subset of the not-evaluated records: ones this control applies to but has no recorded result for. The rest are outside the control entirely.',
      ],
      [
        'Export coverage',
        check.notEvaluatedRows.length < check.notEvaluatedCount
          ? `${check.notEvaluatedRows.length} of ${check.notEvaluatedCount}. The list is capped, and this export carries the same rows the screen presents.`
          : `All ${check.notEvaluatedCount} records.`,
      ],
      ['Observed from Salesforce at', formatObservedAt(observedAtIso)],
      ['Observation timestamp (UTC ISO)', observedAtIso],
      ['Source', 'NorthstarIQ read-only assessment. Salesforce data is synthetic; NorthstarIQ is a fictional company.'],
    ],
  };

  return [context, records];
}
