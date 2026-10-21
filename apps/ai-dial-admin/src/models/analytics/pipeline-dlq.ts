/**
 * The enrichment runner's dead-letter queue: the work it could not finish and will not retry on its own.
 *
 * Separate from `pipeline-runtime.ts` because it answers a different question. That file says whether the
 * runner is driving a pipeline at all; this one says what happened to the rows it drove.
 */

/** The stage a dead-lettered item failed at, in the runner's own spelling. */
export enum DlqStage {
  InputMap = 'input_map',
  DialCall = 'dial_call',
  Validate = 'validate',
  OutputMap = 'output_map',
  Upsert = 'upsert',
  GroupFetch = 'group_fetch',
  GroupMap = 'group_map',
}

/**
 * Which path produced an item, and the listing's filter for it.
 *
 * One enum for both the request and the derived display value: they are the same two states, the service
 * derives its own from the presence of a run id exactly as `pathOf` does, and a second copy would be two
 * places to edit if a third path ever appears.
 */
export enum DlqLane {
  Live = 'live',
  Backfill = 'backfill',
}

/**
 * A dead-lettered item as the ops API serves it: no stored payload, no raw response.
 *
 * Every member the service may omit is optional here. The mapper serializes with `NON_NULL`, so a null
 * column is an absent key rather than a null — including `error`, whose column is nullable and whose
 * value is the exception's message, which some exceptions do not carry.
 */
export interface DlqItem {
  id: number;
  pipeline_name: string;
  /** The row's grain key, or the group's key on a group pipeline. Absent on chunk- and write-grain items. */
  grain_key?: string | null;
  /** The declaration revision the work was recorded against. */
  pipeline_generation?: number | null;
  stage: DlqStage;
  /** The exception message, without a stack trace. Several validation failures arrive joined by `; `. */
  error?: string | null;
  /** The backfill run that produced it; absent means the live path. */
  run_id?: string | null;
  /**
   * Whether the service archived a re-runnable payload for it.
   *
   * This is the whole of what the console can know. The service refuses a second class of item at requeue
   * time — one whose archived payload predates the evaluator fold — and decides that on the payload, which
   * it does not serve. No field here can predict it, so the console offers the re-run and reports the
   * refusal the service answers with.
   */
  requeueable: boolean;
  created_at: string;
}

/**
 * One page of the listing, with the counts of everything the filter matches.
 *
 * The counts are the service's, not the page's: it reads them in the same repeatable-read snapshot as the
 * rows, so a page never disagrees with its own total. That is what lets the card state a pipeline's
 * failures without holding them all.
 */
export interface DlqPage {
  items: DlqItem[];
  /** Passed back as `cursor` for the next page; absent on the last one. */
  next_cursor?: string | null;
  has_more: boolean;
  total: number;
  requeueable_total: number;
}

/** What a requeue did: how many items the service actually sent back to the queue. */
export interface DlqRequeueResponse {
  requeued: number;
}

/**
 * What re-running one item would re-run. Derived rather than reported: the DTO carries no task name, so
 * the stage and the grain key are all there is to go on, and on a group pipeline they do not suffice.
 */
export enum DlqScope {
  /** The whole chunk the row travelled in. */
  Chunk = 'chunk',
  /** One row. */
  Row = 'row',
  /** Only the write-back to the registry, from rows already computed. */
  Write = 'write',
}

/**
 * What a listing asks for. `lane` and `runId` are mutually exclusive: a run's items are backfill items by
 * definition, and the service answers 400 for the pair rather than an empty list.
 */
export interface DlqFilters {
  lane?: DlqLane;
  runId?: string;
}

/** How many of a filter's items there are, and how many of them carry a payload. */
export interface DlqCounts {
  total: number;
  retryable: number;
  notRetryable: number;
}
