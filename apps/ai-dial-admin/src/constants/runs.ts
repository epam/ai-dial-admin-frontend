import { RunStatus } from '@/src/models/evaluation/run';

/** How often a run in a transitional status is re-checked while a surface shows it, in ms. */
export const RUN_CANCEL_POLL_INTERVAL = 5000;

/**
 * Statuses a run leaves on its own, without any user action — rendered as in-progress rather than
 * settled. Mirrors LOADING_STATUSES for containers and images.
 */
export const TRANSITIONAL_RUN_STATUSES = [RunStatus.RUNNING, RunStatus.CANCELLING];

/**
 * Statuses where a run has not produced a full set of results — not yet started, still running,
 * stopped before it finished, or failed part-way — so an absent analytics value is expected rather
 * than a data failure. FAILED belongs here because a failed run often has usage/cost figures without
 * eval_summaries averages; treating that gap as an Error blanked the Summary cost cards.
 */
export const INCOMPLETE_RUN_STATUSES = [
  RunStatus.PENDING,
  ...TRANSITIONAL_RUN_STATUSES,
  RunStatus.CANCELLED,
  RunStatus.FAILED,
];

/**
 * Statuses a run has settled into, so the backend can start aggregating its usage logs into a cost.
 * PENDING and the transitional statuses are excluded: nothing is being aggregated for them yet.
 */
export const COST_AGGREGATING_RUN_STATUSES = [RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED];

/** Every status the Status column's filter can offer, in the order its checkbox list renders them. */
export const ALL_RUN_STATUSES = [
  RunStatus.PENDING,
  RunStatus.COMPLETED,
  RunStatus.RUNNING,
  RunStatus.FAILED,
  RunStatus.CANCELLING,
  RunStatus.CANCELLED,
];
