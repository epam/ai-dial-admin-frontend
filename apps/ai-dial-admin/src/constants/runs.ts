import { RunStatus } from '@/src/models/evaluation/run';

/** How often a run in a transitional status is re-checked while a surface shows it, in ms. */
export const RUN_CANCEL_POLL_INTERVAL = 5000;

/**
 * Statuses a run leaves on its own, without any user action — rendered as in-progress rather than
 * settled. Mirrors LOADING_STATUSES for containers and images.
 */
export const TRANSITIONAL_RUN_STATUSES = [RunStatus.RUNNING, RunStatus.CANCELLING];

/**
 * Statuses where a run has not produced a full set of results — still running, or stopped before it
 * finished — so an absent analytics value is expected rather than a data failure.
 */
export const INCOMPLETE_RUN_STATUSES = [...TRANSITIONAL_RUN_STATUSES, RunStatus.CANCELLED];
