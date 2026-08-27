import 'server-only';

import { query } from './salesforce.ts';
import {
  FIELD_SETUP_ID_SOQL,
  FLOW_SETUP_ID_SOQL,
  REPORT_SETUP_ID_SOQL,
  type FieldDefinitionRecord,
  type FlowDefinitionRecord,
  type ReportRecord,
} from './soql.ts';
import type { Usage } from './traceability.ts';

/**
 * Deep links from a dependency row into the real Salesforce configuration.
 *
 * THE URL SHAPES BELOW WERE VERIFIED BY LOADING THEM AGAINST THE CONNECTED ORG
 * on 2026-08-26, not assumed from documentation. Identifiers are resolved live
 * rather than stored, because a record id is org-specific and belongs nowhere
 * in source control.
 *
 * Three types link; two deliberately do not. A Queue and a Custom Metadata
 * type have no Setup URL shape I could confirm resolves, so those names stay
 * as plain text rather than becoming a link that might 404 in front of an
 * evaluator. An unlinked name is honest; a broken link is not.
 */

/** Keyed by type, object and name - the three things that identify a row. */
export type SetupLinks = Map<string, string>;

const keyFor = (u: Pick<Usage, 'type' | 'object' | 'name'>) =>
  `${u.type}|${u.object}|${u.name}`;

/** The URL for the configuration a dependency row names. */
export function setupLinkFor(links: SetupLinks, usage: Usage): string | null {
  return links.get(keyFor(usage)) ?? null;
}

/**
 * The URL for the field itself.
 *
 * Not every field resolves. An address component such as CountryCode has no
 * FieldDefinition row at all - Salesforce does not expose compound address
 * parts there - so it stays plain text rather than getting a guessed link.
 */
export function fieldLinkFor(links: SetupLinks, usage: Usage): string | null {
  return links.get(`field|${usage.object}|${usage.field}`) ?? null;
}

/**
 * Resolve every linkable identifier in one pass.
 *
 * Three parallel reads of identifiers only. A failure here must never take the
 * page down - dependencies are context, not the finding - so any error falls
 * back to an empty map and every name simply renders as text.
 */
export async function resolveSetupLinks(instanceHost: string | undefined): Promise<SetupLinks> {
  const links: SetupLinks = new Map();
  if (!instanceHost) return links;
  const base = `https://${instanceHost}`;

  /*
   * Settled, not all: the integration principal is least privilege, and the
   * three lookups need different visibility. One type being unreadable must
   * not remove the links for a type that is - that would be an all-or-nothing
   * failure caused by permissions rather than by evidence.
   */
  const [fieldResult, flowResult, reportResult] = await Promise.allSettled([
    query<FieldDefinitionRecord>(FIELD_SETUP_ID_SOQL),
    query<FlowDefinitionRecord>(FLOW_SETUP_ID_SOQL),
    query<ReportRecord>(REPORT_SETUP_ID_SOQL),
  ]);

  const fields = fieldResult.status === 'fulfilled' ? fieldResult.value : [];
  const flows = flowResult.status === 'fulfilled' ? flowResult.value : [];
  const reports = reportResult.status === 'fulfilled' ? reportResult.value : [];

  try {
    for (const f of fields) {
      const object = f.EntityDefinition?.QualifiedApiName;
      /*
       * DurableId is "Lead.00N…" for a custom field and "Lead.Owner" for a
       * standard one. Object Manager takes either half verbatim, so the same
       * split serves both - each shape was checked against this org.
       */
      const fieldId = f.DurableId?.split('.')[1];
      if (!object || !fieldId) continue;
      const url = `${base}/lightning/setup/ObjectManager/${object}/FieldsAndRelationships/${fieldId}/view`;
      // The field cell, and the automation cell where the field IS the formula.
      links.set(`field|${object}|${f.QualifiedApiName}`, url);
      links.set(`Formula field|${object}|${f.QualifiedApiName}`, url);
    }

    for (const f of flows) {
      links.set(
        `Flow|Lead|${f.ApiName}`,
        `${base}/lightning/setup/Flows/page?address=%2F${f.DurableId}`,
      );
    }

    for (const r of reports) {
      links.set(`Report|Lead|${r.Name}`, `${base}/lightning/r/Report/${r.Id}/view`);
    }
  } catch {
    // Identifier lookup is best-effort. Names render as text instead.
    return new Map();
  }

  return links;
}
