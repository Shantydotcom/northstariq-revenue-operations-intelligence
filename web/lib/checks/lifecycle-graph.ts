/**
 * The governed lifecycle transition policy, as a small graph.
 *
 * THE POLICY IS NOT HERE. Which stage may follow which lives in
 * `Lifecycle_Transition__mdt` - the same records `Lead_Inbound_Before_Save`
 * consults before permitting a save. This module turns those records into an
 * adjacency map so a detective control can ask reachability questions about
 * them. It contains no transition of its own: hand it an empty policy and it
 * knows nothing.
 *
 * Deliberately not a state-machine library or a workflow engine. Seven stages
 * and ten edges do not need one, and adding one would put a second definition
 * of the lifecycle in the repository.
 */
import type { LifecycleTransitionRecord } from '../soql.ts';

export interface LifecycleGraph {
  /** Stage -> stages it may transition to, straight from the policy. */
  readonly edges: ReadonlyMap<string, ReadonlySet<string>>;
  /** Every stage the policy mentions, on either side of a transition. */
  readonly stages: ReadonlySet<string>;
  /** Stages no governed transition leads into - where a lifecycle can begin. */
  readonly entryStages: ReadonlySet<string>;
  /** The rule versions the active policy is carrying. */
  readonly versions: readonly string[];
}

/**
 * Raised when the governed transition policy cannot be read.
 *
 * An absent or malformed policy is NOT "every Lead progressed legitimately".
 * The control refuses to report compliance it cannot substantiate. It is
 * unscored and outside `runAllChecks`, so this can never destabilise the live
 * assessment - the same contract `MqlPolicyUnavailableError` carries.
 */
export class LifecyclePolicyUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LifecyclePolicyUnavailableError';
  }
}

/** Build the graph from the active policy records, or refuse. */
export function buildLifecycleGraph(records: LifecycleTransitionRecord[]): LifecycleGraph {
  const active = records.filter((r) => r.Is_Active__c === true);
  if (active.length === 0) {
    throw new LifecyclePolicyUnavailableError(
      'No active lifecycle transition policy was found in Salesforce. NorthstarIQ will not judge a Lead’s progression against a governed model it cannot read.',
    );
  }

  const edges = new Map<string, Set<string>>();
  const stages = new Set<string>();
  const hasInbound = new Set<string>();
  const versions = new Set<string>();

  for (const r of active) {
    const from = (r.From_Stage__c ?? '').trim();
    const to = (r.To_Stage__c ?? '').trim();
    if (from === '' || to === '') {
      throw new LifecyclePolicyUnavailableError(
        'A lifecycle transition record is missing its from-stage or to-stage, so the governed model is incomplete and NorthstarIQ will not reason over it.',
      );
    }
    stages.add(from);
    stages.add(to);
    hasInbound.add(to);
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from)!.add(to);
    if (r.Rule_Version__c) versions.add(r.Rule_Version__c);
  }

  const entryStages = new Set([...stages].filter((s) => !hasInbound.has(s)));
  if (entryStages.size === 0) {
    throw new LifecyclePolicyUnavailableError(
      'Every stage in the lifecycle policy has an inbound transition, so no starting stage can be identified and progression cannot be reasoned about.',
    );
  }

  return { edges, stages, entryStages, versions: [...versions].sort() };
}

/** Is this exact stage-to-stage move one the governed policy permits? */
export function transitionAllowed(g: LifecycleGraph, from: string, to: string): boolean {
  return g.edges.get(from)?.has(to) === true;
}

/** Stages reachable from `start` by following governed transitions. */
export function reachableFrom(g: LifecycleGraph, start: string, skip?: string): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [start];
  while (queue.length) {
    const node = queue.shift()!;
    for (const next of g.edges.get(node) ?? []) {
      if (next === skip || seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Can a Lead standing on `from` still legitimately arrive at `to`? */
export function canReach(g: LifecycleGraph, from: string, to: string): boolean {
  if (from === to) return true;
  return reachableFrom(g, from).has(to);
}

/**
 * Must every governed route to `stage` pass through `through`?
 *
 * Answered by removing `through` from the graph and asking whether `stage` is
 * still reachable from any entry stage. Graph dominance, computed on seven
 * nodes - not a framework.
 *
 * This is what lets the control say "the evidence this stage requires is
 * missing" without ever naming a stage order in code: the policy decides.
 */
export function mustPassThrough(g: LifecycleGraph, stage: string, through: string): boolean {
  if (stage === through) return false;
  if (!g.stages.has(stage) || !g.stages.has(through)) return false;
  for (const entry of g.entryStages) {
    if (entry === stage) return false;
    if (reachableFrom(g, entry, through).has(stage)) return false;
  }
  return true;
}
