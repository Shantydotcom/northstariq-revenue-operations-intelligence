/**
 * Where a piece of evidence came from, and how to reach the record it came from.
 *
 * THE SMALLEST THING A SECOND CRM ACTUALLY REQUIRES. NorthstarIQ's controls,
 * populations, predicates and scoring are already source-neutral: they are pure
 * functions over records someone else fetched. Two things are not:
 *
 *   1. A result carried no statement of WHICH system produced it. With one
 *      source that is harmless - everything is Salesforce - and with two it
 *      silently erases provenance, which is the one thing evidence may never
 *      lose.
 *   2. Building an investigation link assumed one URL shape, one host and one
 *      id format.
 *
 * This module is those two things and nothing else. It is deliberately NOT a
 * connector framework, a provider registry, a plugin system or an adapter base
 * class: a discriminated union and a function that switches on it are what a
 * second source needs, and a portfolio MVP should not carry more.
 *
 * NORMALISATION STOPS HERE. NorthstarIQ normalises only *attribution* and *how
 * to reach the record*. It does not normalise the records themselves - a
 * Salesforce Lead and a HubSpot contact are not the same object, and pretending
 * otherwise to obtain a tidy shared schema would misrepresent both.
 */

/**
 * The systems NorthstarIQ can accept evidence from.
 *
 * A union rather than a string, so a source that has no URL rule yet is a
 * compile error instead of a silently unlinkable finding. Step 11 adds
 * `'hubspot'` here and one branch below; nothing else in the application needs
 * to know a second source exists.
 */
export type EvidenceSourceId = 'salesforce';

/** How each source is named wherever provenance is shown to a reader. */
export const SOURCE_LABEL: Record<EvidenceSourceId, string> = {
  salesforce: 'Salesforce',
};

/**
 * The Salesforce record URL rule, unchanged.
 *
 * Re-exported through this module so every caller resolves a link the same way
 * regardless of source, while the rule itself keeps its single definition in
 * `record-url.ts`.
 */
import { recordUrl } from './record-url.ts';

/**
 * An investigation link for one record in its own system, or `null`.
 *
 * `null` is returned - never a guessed URL - when the tenant is unknown or the
 * identifier does not match the source's own format. A finding that cannot be
 * linked is still a finding; a link that goes somewhere wrong is worse than no
 * link at all.
 *
 * `objectType` is accepted because HubSpot record URLs embed the object the
 * record belongs to, and Salesforce Lightning URLs do not. It is therefore
 * unused on the Salesforce branch by design, not by oversight, and Step 11
 * supplies it when it has a HubSpot control whose records need it.
 */
export function evidenceRecordUrl(
  source: EvidenceSourceId,
  /** The tenant the records live in - a Salesforce instance host today. */
  tenant: string | undefined,
  recordId: string,
  objectType?: string,
): string | null {
  switch (source) {
    case 'salesforce':
      // Salesforce Lightning resolves a record from its id alone.
      return recordUrl(tenant, recordId);
    default: {
      /* Exhaustiveness: a new source must add its rule above, not fall through
       * to a Salesforce URL that would attribute its evidence to the wrong
       * system. */
      const unreachable: never = source;
      return unreachable;
    }
  }
}
