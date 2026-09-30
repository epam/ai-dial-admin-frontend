/**
 * The enrichment runner's view of a pipeline, which is separate from the registry's: the registry holds
 * the declaration, the runner holds whether its enqueue is currently being driven.
 */

/** Who paused a pipeline, which decides whether the pause can expire. */
export enum PauseOrigin {
  /** A deliberate decision. It never expires and is lifted only by resuming. */
  Operator = 'operator',
  /** The runner's dead-letter circuit breaker. It lifts itself at `resumes_at`. */
  Breaker = 'breaker',
}

export interface PausedPipeline {
  pipelineName: string;
  origin: PauseOrigin;
  /** What the runner recorded when it took the pause. Free text, not a closed vocabulary. */
  reason?: string;
  since: string;
  /** Present on a breaker pause only; an operator pause never expires. */
  resumesAt?: string;
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

/** What the console can state about one pipeline's runtime, given both reads. */
export enum PipelineRuntimeStatus {
  /** The runner has it and is firing it. */
  Running = 'running',
  /** The runner has it and is skipping its fires. */
  Paused = 'paused',
  /** Enabled, but the runner has not taken it on: it refused it, or has not synced it yet. */
  NotTracked = 'not-tracked',
  /** Nothing can be said: disabled, unread runner, or a caller without the rights to ask. */
  Unknown = 'unknown',
}
