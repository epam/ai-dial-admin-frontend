'use client';

import { FC, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp, IconRefresh } from '@tabler/icons-react';

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

  // Nothing to report is reported by not being here. A heading over an empty card states that
  // something is missing, where the truth is that nothing has failed — the same reason the schedule
  // group is absent on a pipeline that has no schedule. An absent runner is the same silence: it is a
  // deployment choice rather than a fault, so it raises no error either.
  //
  // An outcome keeps the card alive even at zero, because zero is what a successful re-run produces:
  // without this the card — and the live region inside it — vanished at the moment it had something
  // to say, and the only confirmation of the action lasted one round trip.
  const hasNothingToSay = counts.total === 0 && !failures.hasFailed && !requeue.outcome;
  if (failures.isUnavailable || hasNothingToSay) return null;

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

      {/* The read failed. Never the empty state: on a failure listing the two are opposite conclusions
          and the quiet one is the dangerous one. */}
      {failures.hasFailed && (
        <div className="flex flex-row flex-wrap items-center gap-3" role="status">
          <span className="dial-small-text text-error">{t(AnalyticsPipelinesI18nKey.FailuresReadFailed)}</span>
          <Button
            variant={ButtonVariant.Neutral}
            appearance={ButtonAppearance.Outlined}
            size={ElementSize.Small}
            label={t(AnalyticsPipelinesI18nKey.FailuresReadAgain)}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            onClick={() => void failures.reload()}
          />
        </div>
      )}

      {/* What a re-run left behind, when it left nothing. The card is here only to say it. */}
      {counts.total === 0 && !failures.hasFailed && (
        <p className="dial-small-text text-secondary">{t(AnalyticsPipelinesI18nKey.FailuresNone)}</p>
      )}

      {counts.total > 0 && (
        <>
          <div className="flex flex-row flex-wrap items-baseline gap-x-2">
            <span className="dial-display3-text text-error">{counts.total}</span>
            <span className="dial-small-text text-secondary">
              {t(AnalyticsPipelinesI18nKey.FailuresUnit, { count: counts.total })}
            </span>
            {newestAt && (
              <span className="dial-small-text text-secondary">
                {t(AnalyticsPipelinesI18nKey.FailuresLast, { age: formatRelativeTime(newestAt, now) })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3 rounded border border-secondary p-3">
              <div className="flex flex-col gap-1">
                <span className="dial-small-semi-text text-primary">
                  {t(AnalyticsPipelinesI18nKey.FailuresRetryable, { count: counts.retryable })}
                </span>
                <span className="dial-tiny-text text-secondary">
                  {t(AnalyticsPipelinesI18nKey.FailuresRetryableHint)}
                </span>
              </div>
              {counts.retryable > 0 && (
                <Button
                  variant={ButtonVariant.Neutral}
                  appearance={ButtonAppearance.Outlined}
                  size={ElementSize.Small}
                  label={t(AnalyticsPipelinesI18nKey.FailuresRetryAll)}
                  iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  disabled={requeue.isBusy}
                  onClick={onRetryAll}
                />
              )}
            </div>

            <div className="flex flex-col gap-1 rounded border border-secondary p-3">
              <span className="dial-small-semi-text text-primary">
                {t(AnalyticsPipelinesI18nKey.FailuresNotRetryable, { count: counts.notRetryable })}
              </span>
              <span className="dial-tiny-text text-secondary">
                {t(AnalyticsPipelinesI18nKey.FailuresNotRetryableHint)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* What the last re-run did. On the card rather than only in a toast: the service re-runs fewer
          items than it was asked for whenever it refuses one, and that difference is worth leaving on
          screen. */}
      <span role="status" aria-live="polite" className={requeue.outcome ? 'dial-small-text text-secondary' : 'sr-only'}>
        {requeue.outcome}
      </span>

      <div id={gridId}>
        {isExpanded && (
          <div className="border-t border-secondary pt-4">
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
