'use client';

import { FC, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import FailuresOutcomeStatus from '@/src/components/Analytics/Common/Failures/FailuresOutcomeStatus';
import FailuresReadFailed from '@/src/components/Analytics/Common/Failures/FailuresReadFailed';
import FailuresSummaryHeader from '@/src/components/Analytics/Common/Failures/FailuresSummaryHeader';
import FailuresTiles from '@/src/components/Analytics/Common/Failures/FailuresTiles';
import FailuresGrid from '@/src/components/Analytics/Pipelines/Failures/FailuresGrid';
import RequeueFailuresPopup from '@/src/components/Analytics/Pipelines/Failures/RequeueFailuresPopup';
import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { useRequeueFailures } from '@/src/components/Analytics/Pipelines/Failures/use-requeue-failures';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useMinuteTick } from '@/src/hooks/use-minute-tick';
import { useI18n } from '@/src/locales/client';
import { DlqLane } from '@/src/models/analytics/pipeline-dlq';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

interface Props {
  pipeline: Pipeline;
  failures: PipelineFailuresRead;
  /** Drives the caveat on both confirmations: a re-run into a paused pipeline waits in the queue. */
  isPaused: boolean;
}

/** What a bulk re-run is pending on: the whole pipeline, or one of its runs. */
interface PendingRequeue {
  runId?: string;
  count: number;
}

const PATH_FILTER_LABEL: Record<DlqLane, AnalyticsPipelinesI18nKey> = {
  [DlqLane.Live]: AnalyticsPipelinesI18nKey.FailuresPathLive,
  [DlqLane.Backfill]: AnalyticsPipelinesI18nKey.FailuresPathBackfill,
};

/**
 * The pipeline's dead letters, in one card.
 *
 * Collapsed it answers "is anything wrong, how much, and can I do something about it"; expanded it
 * opens the grid in the same card, so the answer and the detail are never on two screens. There is no
 * tab of its own for them: the pause a dead-letter burst causes is stated on this page, and the
 * failures are the reason for it.
 *
 * The figures are the service's, over the whole pipeline. A path or a run chosen inside the card
 * narrows the rows and leaves the headline alone — it answers what is wrong with this pipeline, and a
 * total that fell because the reader looked at one path would be reporting the filter.
 */
const PipelineFailuresCard: FC<Props> = ({ pipeline, failures, isPaused }) => {
  const t = useI18n();

  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingRequeue | null>(null);
  const gridId = useId();

  const { counts, newestAt } = failures;

  // Only while there is an age on screen to keep current.
  const now = useMinuteTick(counts.total > 0);

  const requeue = useRequeueFailures({
    pipelineName: pipeline.name,
    isPaused,
    onRequeued: failures.reload,
  });

  // Worded for the confirmation, which has to say what the re-run is *not* scoped to. The path and the
  // run belong here as much as the search does — the path is the one the reader is looking at.
  const activeFilters = useMemo(
    () =>
      [
        failures.filters.runId ? t(AnalyticsPipelinesI18nKey.FailuresRunFilter, { id: failures.filters.runId }) : null,
        failures.filters.lane ? t(PATH_FILTER_LABEL[failures.filters.lane]) : null,
        search.trim() ? t(AnalyticsPipelinesI18nKey.FailuresFilterSearch, { term: search.trim() }) : null,
      ].filter(Boolean) as string[],
    [failures.filters, search, t],
  );

  const onToggle = useCallback(() => setIsExpanded((prev) => !prev), []);

  const onRetryAll = useCallback(() => setPending({ count: counts.retryable }), [counts.retryable]);

  const onRetryOne = useCallback((id: number) => void requeue.retryOne(id), [requeue]);

  const onRetryRun = useCallback((runId: string, count: number) => setPending({ runId, count }), []);

  const onConfirmRequeue = useCallback(() => {
    if (!pending) return;

    const { runId, count } = pending;
    setPending(null);
    void requeue.retryMany(runId, count);
  }, [pending, requeue]);

  // The toggle must not outlive the rows: a pipeline drained by a re-run collapses rather than keeping
  // an expanded grid of nothing.
  useEffect(() => {
    if (counts.total === 0) setIsExpanded(false);
  }, [counts.total]);

  // Zero is stated, not implied by absence. This card is drawn only for a kind that dead-letters, so
  // a missing card left the reader unable to tell "nothing failed" from "this page does not track
  // failures".
  //
  // Not before the first answer, though: the counters start at zero, and a card drawn then would state
  // "no failures" about a pipeline nobody has asked yet. An absent runner stays silent too: it is a
  // deployment choice rather than a fault, so it raises neither a card nor an error.
  const isAwaitingFirstRead = !failures.hasAnswered && !failures.hasFailed;
  if (failures.isUnavailable || isAwaitingFirstRead) return null;

  return (
    <section
      aria-label={t(AnalyticsPipelinesI18nKey.FailuresTitle)}
      className="flex flex-col gap-4 rounded bg-layer-3 p-4"
    >
      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <h3 className="dial-small-semi-text uppercase tracking-wide text-secondary">
          {t(AnalyticsPipelinesI18nKey.FailuresTitle)}
        </h3>
        {counts.total > 0 && (
          <Button
            variant={ButtonVariant.Primary}
            size={ElementSize.Small}
            label={t(isExpanded ? AnalyticsPipelinesI18nKey.FailuresHide : AnalyticsPipelinesI18nKey.FailuresShowAll)}
            iconBefore={
              isExpanded ? (
                <IconChevronUp {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              ) : (
                <IconChevronDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              )
            }
            aria-expanded={isExpanded}
            aria-controls={gridId}
            onClick={onToggle}
          />
        )}
      </div>

      {failures.hasFailed && (
        <FailuresReadFailed
          message={t(AnalyticsPipelinesI18nKey.FailuresReadFailed)}
          retryLabel={t(AnalyticsPipelinesI18nKey.FailuresReadAgain)}
          onRetry={() => void failures.reload()}
        />
      )}

      {/* Nothing has failed, or a re-run drained what had. */}
      {counts.total === 0 && !failures.hasFailed && (
        <p className="dial-small-text text-secondary">{t(AnalyticsPipelinesI18nKey.FailuresNone)}</p>
      )}

      {counts.total > 0 && (
        <>
          <FailuresSummaryHeader
            total={counts.total}
            unitLabel={t(AnalyticsPipelinesI18nKey.FailuresUnit, { count: counts.total })}
            lastFailureLabel={
              newestAt
                ? t(AnalyticsPipelinesI18nKey.FailuresLast, { age: formatRelativeTime(newestAt, now) })
                : undefined
            }
          />

          <FailuresTiles
            action={{
              label: t(AnalyticsPipelinesI18nKey.FailuresRetryable, { count: counts.retryable }),
              hint: t(AnalyticsPipelinesI18nKey.FailuresRetryableHint),
              retryAllLabel: t(AnalyticsPipelinesI18nKey.FailuresRetryAll),
              canRetryAll: counts.retryable > 0,
              isBusy: requeue.isBusy,
              onRetryAll,
            }}
            passive={{
              label: t(AnalyticsPipelinesI18nKey.FailuresNotRetryable, { count: counts.notRetryable }),
              hint: t(AnalyticsPipelinesI18nKey.FailuresNotRetryableHint),
            }}
          />
        </>
      )}

      {/* What the last re-run did. On the card rather than only in a toast: the service re-runs fewer
          items than it was asked for whenever it refuses one, and that difference is worth leaving on
          screen. */}
      <FailuresOutcomeStatus message={requeue.outcome} />

      <div id={gridId}>
        {isExpanded && (
          <div className="border-t border-tertiary pt-4">
            <FailuresGrid
              failures={failures}
              trigger={pipeline.trigger?.kind}
              search={search}
              isBusy={requeue.isBusy}
              now={now}
              onSearchChange={setSearch}
              onRetryOne={onRetryOne}
              onRetryRun={onRetryRun}
            />
          </div>
        )}
      </div>

      {pending && (
        <RequeueFailuresPopup
          count={pending.count}
          runId={pending.runId}
          activeFilters={pending.runId ? [] : activeFilters}
          isPaused={isPaused}
          onConfirm={onConfirmRequeue}
          onClose={() => setPending(null)}
        />
      )}
    </section>
  );
};

export default PipelineFailuresCard;
