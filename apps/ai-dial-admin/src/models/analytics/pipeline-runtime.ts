/**
 * The enrichment runner's view of a pipeline, which is separate from the registry's: the registry holds
 * the declaration, the runner holds whether its enqueue is currently being driven.
 */

/**
 * What the console answers with instead of calling a runner it has no host for.
 *
 * An installation without a runner is a deployment choice, not a fault, so the two must be told apart by
 * whoever presents the result: a failed read is worth an error and a retry, an absent service is worth
 * nothing at all. It is carried in `errorHeader`, where the runner's own machine codes arrive, so the
 * caller reads one field either way.
 */
export const RUNNER_NOT_CONFIGURED = 'runner_not_configured';

/**
 * The runner started and has not loaded its pipeline list yet, so it cannot say whether a pipeline
 * exists. It clears on its own within a sync, which is what separates it from a failed read.
 */
export const RUNNER_CACHE_COLD = 'pipeline_cache_cold';

/**
 * A synced runner does not hold this pipeline. Not a failure: it is how the runner says it refused the
 * declaration as one it cannot execute, or has not picked it up — the state the console already states
 * as nothing running the pipeline.
 */
export const RUNNER_PIPELINE_NOT_FOUND = 'not_found';

/**
 * A listing cursor the runner did not issue, or one issued under the other order. The console passes cursors back
 * untouched, so a refusal means the walk itself is stale.
 */
export const RUNNER_INVALID_CURSOR = 'invalid_cursor';

/** Who paused a pipeline, which decides whether the pause can expire. */
export enum PauseOrigin {
  /** A deliberate decision. It never expires and is lifted only by resuming. */
  Operator = 'operator',
  /** The runner's dead-letter circuit breaker. It lifts itself at `resumes_at`. */
  Breaker = 'breaker',
}

/**
 * The pause in force, as both the global listing and a pipeline's own runtime view report it — the same
 * members under the same names, because they are the same pause read through two routes.
 */
export interface PipelinePause {
  origin?: PauseOrigin;
  /** What the runner recorded when it took the pause. Free text, not a closed vocabulary. */
  reason?: string;
  /**
   * When the pause began. Optional, because the runtime view holds it in memory and a restart can lose
   * it while the pause itself survives. A reader states the age only where it is present; withholding
   * the whole pause for a missing timestamp would withhold the resume control with it.
   */
  since?: string;
  /** Present on a breaker pause only; an operator pause never expires. */
  resumes_at?: string;
}

/**
 * One entry of the global listing, which has to name the pipeline each pause belongs to — and which
 * reads the pause from durable state, so both members the view may omit are always there.
 */
export interface PausedPipeline extends PipelinePause {
  pipeline_name: string;
  origin: PauseOrigin;
  since: string;
}

export interface PausedPipelinesResponse {
  paused: PausedPipeline[];
}

/**
 * One pipeline the runner has taken on. Its presence is the fact worth reading: the runner caches a
 * pipeline only when it is enabled **and** the runner can actually execute it, and it schedules the
 * recurring work from exactly this set. An enabled pipeline missing from it is one nothing is driving.
 */
export interface RunnerPipelineEntry {
  name: string;
  enabled: boolean;
  generation: number;
}

export interface RunnerPipelineCacheResponse {
  pipelines: RunnerPipelineEntry[];
}

/**
 * What the console knows about the runner after asking it once.
 *
 * `isRead` is false both when the runner is unconfigured and when it did not answer. The two are one
 * state here on purpose: neither supports stating a pipeline's runtime, and a reader can act on neither.
 */
export interface PipelineRuntimeRead {
  /** The pauses were read. Everything the console states about the runtime rests on this one. */
  isRead: boolean;
  /**
   * The cache listing was read too. Kept apart from `isRead` on purpose: the pauses are what the pause
   * control needs, and a deployment whose runner does not serve the cache listing — an older build, a
   * route that answers 404 — must still be able to pause a pipeline. Without this flag the console
   * withheld every runtime affordance the moment one of the two reads failed.
   */
  isTrackingRead: boolean;
  /** Paused pipelines by name. Empty while `isRead` is false. */
  paused: Record<string, PausedPipeline>;
  /** Names the runner has taken on and schedules. Empty while `isTrackingRead` is false. */
  tracked: Set<string>;
}

/**
 * What the console can state about one pipeline's runtime.
 *
 * Two producers fill it, and they reach different members. The **listing** derives it from the two
 * global listings, which carry membership and pauses and nothing else, so it yields only `Running`,
 * `Paused`, `NotTracked` and `Unknown`. The **detail page** reads the pipeline's own runtime view, which
 * states the service's own verdict, so it additionally yields the three gate states below.
 *
 * A new gate state in the runner is therefore added here once, and the listing keeps not producing it.
 */
export enum PipelineRuntimeStatus {
  /** The runner has it and is firing it. */
  Running = 'running',
  /** The runner has it and is skipping its fires. */
  Paused = 'paused',
  /** Waiting on the registry across a contract change. Clears when the two agree again. */
  Held = 'held',
  /** Over its daily spend budget. Clears at the next UTC day. */
  OverBudget = 'over-budget',
  /** Holding back because its own queue is full. Clears as that queue drains. */
  Backpressured = 'backpressured',
  /** Enabled, but the runner has not taken it on: it refused it, or has not synced it yet. */
  NotTracked = 'not-tracked',
  /** Nothing can be said: disabled, unread runner, or a caller without the rights to ask. */
  Unknown = 'unknown',
}

/**
 * Which lane the runner executes a pipeline in. It arrives with the view rather than being derived:
 * the runner decides it from the declaration — a `sql` transform is `Class1`, a group trigger is
 * `Group`, anything else is `Row` — and a console that re-derived it would be keeping a second copy of
 * the runner's routing rules in sync by hand.
 */
export enum PipelineLane {
  Row = 'row',
  Group = 'group',
  Class1 = 'class1',
}

/**
 * The pipeline's state, as the runner's own status logic decides it. The three between `Paused` and
 * `Active` are gates: the pipeline is enabled and taken on, and is consuming nothing. Each clears for a
 * different reason, which is why they are not one state.
 */
export enum PipelineRuntimeState {
  Active = 'active',
  Paused = 'paused',
  /** Waiting on the registry across a contract change. */
  Held = 'held',
  /** Over its daily spend budget; the budget counts successful calls only. */
  OverBudget = 'over_budget',
  /** Its queue is at the depth the runner holds back at. */
  Backpressured = 'backpressured',
}

/**
 * The pipeline's state, with its pause attached.
 *
 * The pause members are `Partial<PipelinePause>` rather than their own set: they are present exactly
 * while the state is `Paused`, and spelling them again here would be a second declaration of one shape
 * that could drift from the first.
 */
export interface RuntimeStatus extends Partial<PipelinePause> {
  state: PipelineRuntimeState;
}

export interface RuntimeSchedule {
  /** When a live fire last committed a page or window, an empty one included. */
  last_scan_at?: string;
  /** Omitted while a fire is running, which `running_now` states instead. */
  next_run_at?: string;
  running_now?: boolean;
  /** A fire skipped by a gate completes normally and resets this to zero. */
  consecutive_failures?: number;
  /** The runner's own classified message. Unknown after a restart, and absent once a fire succeeds. */
  last_error?: string;
  last_error_at?: string;
}

export interface RuntimeProgress {
  lag_seconds?: number;
  /** Whether the last fire's last page or window reported more input. */
  has_more?: boolean;
  /** When a fire last ended with nothing more to read. */
  caught_up_at?: string;
  /** When the pipeline last wrote rows, a backfill run's writes included. */
  last_write_at?: string;
}

/**
 * The work items backpressure counts. Read beside the lag: the scan advances when work is enqueued
 * rather than when it is written, so a lag of zero with items here is an ordinary state, not a
 * finished one.
 */
export interface RuntimeQueue {
  computing?: number;
  awaiting_write?: number;
}

/** A group pipeline's dirty groups. `pending` is the sum of the other three. */
export interface RuntimeGroups {
  pending?: number;
  ready?: number;
  waiting_idle?: number;
  ceiling_blocked?: number;
}

/** The current UTC day's model calls. Failed calls are never charged to the budget. */
export interface RuntimeSpend {
  calls?: number;
  tokens?: number;
  failed_calls?: number;
}

/**
 * The live lane's dead letters, counted as the dead-letter listing counts them.
 *
 * Not what the failures card presents: that card's summary also states the age of the newest failure,
 * which this does not carry, and one summary assembled from two reads taken at two moments is the
 * disagreement the card exists to avoid.
 */
export interface RuntimeFailures {
  total: number;
  requeueable_total: number;
}

/**
 * What the runner is doing with one pipeline right now, in one shape for every lane.
 *
 * A section the lane has no answer for is **absent**, not zero-filled — a sql transform has no queue,
 * no spend and no dead letters, and only a group trigger has group readiness. Inside a present section
 * an absent member means the runner does not currently know it, which happens after a restart for the
 * members it holds in memory.
 *
 * That second rule is why **every** member of every section is optional, including the counts the
 * service's own DTO declares as primitives. The console cannot enforce the DTO at runtime, and a count
 * typed as present is a count rendered without a guard — which is a thrown `TypeError` in a client
 * component rather than one missing line.
 */
export interface PipelineRuntimeView {
  pipeline_name: string;
  lane: PipelineLane;
  /** The declaration revision the runner holds, which lags the registry's until it syncs. */
  generation: number;
  status: RuntimeStatus;
  schedule: RuntimeSchedule;
  progress: RuntimeProgress;
  /** Row and group lanes only. */
  queue?: RuntimeQueue;
  /** Group lane only. */
  groups?: RuntimeGroups;
  /** Row and group lanes only. */
  spend_today?: RuntimeSpend;
  /** Row and group lanes only. */
  failures?: RuntimeFailures;
}

/**
 * What came back when the console asked the runner about one pipeline.
 *
 * One value rather than a set of flags, because the reader has to state exactly one thing and the
 * flags made that a conjunction nobody got right: "not asked yet" and "no runner at all" were the same
 * two booleans, and a failed read was told apart from a refusal by a condition that also caught both.
 * Every one of them calls for different words on screen, and `Pending` in particular calls for none —
 * a verdict about the runner published before the runner has answered is wrong however it is worded.
 */
export enum RuntimeReadOutcome {
  /** Nothing has been asked yet, or a read is in flight. State nothing. */
  Pending = 'pending',
  /** No runner host is configured, or this pipeline is not one the runner drives. */
  Unavailable = 'unavailable',
  /** The runner has not loaded its pipeline list yet. It clears on its own. */
  Cold = 'cold',
  /** A synced runner does not hold this pipeline: nothing is driving it. */
  NotHeld = 'not-held',
  /** The runner answered. */
  Read = 'read',
  /** The read was refused or did not arrive. */
  Failed = 'failed',
}
