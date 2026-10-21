import { DlqCounts, DlqItem, DlqLane, DlqPage, DlqScope, DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';

/** What the runner joins several validation failures with before storing them as one message. */
const ERROR_PART_SEPARATOR = '; ';

/**
 * Whether this pipeline can dead-letter at all.
 *
 * Only a model-calling enrichment can. A SQL enrichment and an aggregate are all-or-nothing — the
 * statement either applies to the whole batch or fails it — so their failures are the run's, reported
 * as `last_error` on the registry's own state. A per-row queue of them would list either nothing or
 * everything, and in neither case would a single row be the thing to act on.
 */
export const hasDeadLetters = (kind: PipelineKind, transform?: TransformType): boolean =>
  kind === PipelineKind.Enrich && transform === TransformType.Llm;

/**
 * Whether re-running this item would do anything, as far as the console can tell.
 *
 * It is the service's own flag and nothing more. The service refuses a second class of item at requeue
 * time — one whose archived payload predates the evaluator fold — but it decides that on the payload,
 * which it does not serve, and the `pipeline_generation` column is not a stand-in: a migration renamed
 * the old `evaluator_version` into it without rewriting the rows, so a pre-fold item carries a
 * perfectly ordinary-looking revision there. Predicting that refusal is therefore not possible; the
 * console offers the re-run and reports what the service answers.
 */
export const isRetryable = (item: DlqItem): boolean => item.requeueable;

/** Which path produced the item. The service derives the same thing from the same member. */
export const pathOf = (item: DlqItem): DlqLane => (item.run_id ? DlqLane.Backfill : DlqLane.Live);

/**
 * What re-running the item would re-run — or nothing, on a group pipeline.
 *
 * On a row pipeline the two members settle it: a grain key means the item is one row's, its absence at
 * the write stage means the item is a write-back, and its absence anywhere else means the item is the
 * chunk the row travelled in.
 *
 * On a **group** pipeline `grain_key` holds the group's key rather than a row's, so the first arm would
 * fire for every item and state the opposite of the truth. The DTO carries no task name — the member
 * that would settle it, and the one the service itself dispatches the re-run on — so there is nothing
 * to fall back to and the caller presents no scope at all.
 */
export const scopeOf = (item: DlqItem, trigger?: TriggerKind): DlqScope | undefined => {
  if (trigger === TriggerKind.Group) return undefined;
  if (item.grain_key != null) return DlqScope.Row;

  return item.stage === DlqStage.Upsert ? DlqScope.Write : DlqScope.Chunk;
};

/**
 * The split the card presents, from the service's own counters.
 *
 * Counted by the service over the whole filter rather than derived from the rows on screen: the listing
 * is paged, so the rows are a window and a count taken from them would describe the window. The service
 * reads the counters in the same snapshot as the page, so the two cannot disagree.
 */
export const countsOf = (page: Pick<DlqPage, 'total' | 'requeueable_total'>): DlqCounts => ({
  total: page.total,
  retryable: page.requeueable_total,
  notRetryable: Math.max(page.total - page.requeueable_total, 0),
});

/**
 * One failure per line. A schema rejection arrives as every violation joined into one string, which on
 * one line is a paragraph nobody reads to the end; split, it is a list of things to fix.
 *
 * An item with no message at all is ordinary rather than impossible: the column is nullable, the
 * service omits a null key, and some exceptions carry no message.
 */
export const errorLines = (error?: string | null): string[] =>
  (error ?? '')
    .split(ERROR_PART_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);

/** Whether an already-lowercased term appears in the message or the grain key. */
export const matchesSearch = (item: DlqItem, needle: string): boolean => {
  if (!needle) return true;

  return Boolean(item.error?.toLowerCase().includes(needle)) || Boolean(item.grain_key?.toLowerCase().includes(needle));
};

/**
 * The rows the grid shows: the pages loaded so far, narrowed by the search.
 *
 * The needle is lowercased once here rather than once per item — the list grows a page at a time and
 * the field filters on every keystroke.
 */
export const visibleFailures = (items: DlqItem[], search: string): DlqItem[] => {
  const needle = search.trim().toLowerCase();
  if (!needle) return items;

  return items.filter((item) => matchesSearch(item, needle));
};
