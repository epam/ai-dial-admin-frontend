'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import FailuresOutcomeStatus from '@/src/components/Analytics/Common/Failures/FailuresOutcomeStatus';
import FailuresReadFailed from '@/src/components/Analytics/Common/Failures/FailuresReadFailed';
import FailuresRunFilter from '@/src/components/Analytics/Common/Failures/FailuresRunFilter';
import FailuresSummaryHeader from '@/src/components/Analytics/Common/Failures/FailuresSummaryHeader';
import FailuresTiles from '@/src/components/Analytics/Common/Failures/FailuresTiles';
import BackfillDrawer from '@/src/components/Analytics/Common/BackfillSidebar/BackfillDrawer';
import IngestFailuresGrid from '@/src/components/Analytics/Tables/IngestFailures/IngestFailuresGrid';
import IngestFailuresPendingList from '@/src/components/Analytics/Tables/IngestFailures/IngestFailuresPendingList';
import IngestFailuresSelectionBar from '@/src/components/Analytics/Tables/IngestFailures/IngestFailuresSelectionBar';
import IngestRetryConfirm from '@/src/components/Analytics/Tables/IngestFailures/IngestRetryConfirm';
import { IngestFailureGroup, PendingIngestRetry } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { useIngestFailures } from '@/src/components/Analytics/Tables/IngestFailures/use-ingest-failures';
import { useIngestSelection } from '@/src/components/Analytics/Tables/IngestFailures/use-ingest-selection';
import { useRetryIngestFailures } from '@/src/components/Analytics/Tables/IngestFailures/use-retry-ingest-failures';
import {
  failureKey,
  groupIngestFailures,
  isDeterministicReason,
  newestFailureAt,
  toRetryTarget,
} from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useMinuteTick } from '@/src/hooks/use-minute-tick';
import { useI18n } from '@/src/locales/client';
import { IngestFailure } from '@/src/models/analytics/ingest-failure';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

interface Props {
  backfillRunId?: string;
  onClose: () => void;
}

const IngestFailuresDrawer: FC<Props> = ({ backfillRunId, onClose }) => {
  const t = useI18n();

  const [runId, setRunId] = useState(backfillRunId);
  const [pending, setPending] = useState<PendingIngestRetry | null>(null);

  const read = useIngestFailures(runId);
  const retry = useRetryIngestFailures({ backfillRunId: runId, onRetried: read.reload });
  const selection = useIngestSelection(read.parked);

  const total = read.byState.parked + read.byState.pending;
  const now = useMinuteTick(total > 0);

  const groups = useMemo(() => groupIngestFailures(read.parked), [read.parked]);
  const newestAt = useMemo(() => newestFailureAt([...read.parked, ...read.pending]), [read.parked, read.pending]);
  const isSweepOff = read.retrySweep?.enabled === false;

  const onRetryOne = useCallback(
    (failure: IngestFailure) => void retry.retryTargets([toRetryTarget(failure)]),
    [retry],
  );

  const onRetryGroup = useCallback(
    async (group: IngestFailureGroup) => {
      const isDeterministic = isDeterministicReason(group.reason, group.failures[0]?.failure_class);
      setPending({ group, isDeterministic });

      const count = await retry.readGroupCount(group);
      setPending((prev) => (prev?.group === group ? { ...prev, count } : prev));
    },
    [retry],
  );

  const onRetrySelected = useCallback(() => {
    const isDeterministic = read.parked.some(
      (failure) =>
        selection.keys.has(failureKey(failure)) && isDeterministicReason(failure.reason, failure.failure_class),
    );
    setPending({ targets: selection.targets, count: selection.targets.length, isDeterministic });
  }, [read.parked, selection]);

  const onConfirm = useCallback(() => {
    if (!pending) return;

    setPending(null);
    if (pending.group) void retry.retryGroup(pending.group);
    else if (pending.targets) void retry.retryTargets(pending.targets);
  }, [pending, retry]);

  const emptyMessage = runId ? t(IngestFailuresI18nKey.NoneInRun) : t(IngestFailuresI18nKey.None);
  const hasData = read.hasAnswered && !read.hasFailed && !read.isUnavailable;
  const isFirstLoading = read.isLoading && !read.hasAnswered && !read.hasFailed && !read.isUnavailable;

  return (
    <BackfillDrawer isOpen onClose={onClose} title={t(IngestFailuresI18nKey.Title)}>
      <div className="flex flex-col gap-4">
        {runId && (
          <div className="flex flex-row">
            <FailuresRunFilter
              label={t(IngestFailuresI18nKey.RunFilter, { id: runId })}
              removeLabel={t(IngestFailuresI18nKey.ClearRun)}
              isDisabled={retry.isBusy}
              onClear={() => setRunId(undefined)}
            />
          </div>
        )}

        {read.isUnavailable && <p className="dial-small-text text-secondary">{t(IngestFailuresI18nKey.Unavailable)}</p>}

        {isFirstLoading && <Spinner size={24} fullWidth ariaLabel={t(IngestFailuresI18nKey.Loading)} />}

        {read.hasFailed && (
          <FailuresReadFailed
            message={t(IngestFailuresI18nKey.ReadFailed)}
            retryLabel={t(IngestFailuresI18nKey.ReadAgain)}
            onRetry={() => void read.reload()}
          />
        )}

        {hasData && total === 0 && <p className="dial-small-text text-secondary">{emptyMessage}</p>}

        {hasData && total > 0 && (
          <>
            <FailuresSummaryHeader
              total={total}
              unitLabel={t(IngestFailuresI18nKey.Unit, { count: total })}
              lastFailureLabel={
                newestAt ? t(IngestFailuresI18nKey.Last, { age: formatRelativeTime(newestAt, now) }) : undefined
              }
            />

            <FailuresTiles
              action={{
                label: t(IngestFailuresI18nKey.NeedsRetry, { count: read.byState.parked }),
                hint: t(IngestFailuresI18nKey.NeedsRetryHint),
              }}
              passive={{
                label: t(IngestFailuresI18nKey.RetryingAutomatically, { count: read.byState.pending }),
                hint: t(
                  isSweepOff
                    ? IngestFailuresI18nKey.RetryingWaitingHint
                    : IngestFailuresI18nKey.RetryingAutomaticallyHint,
                ),
              }}
            />

            {isSweepOff && (
              <p className="dial-small-semi-text text-primary" role="note">
                {t(IngestFailuresI18nKey.SweepOff)}
              </p>
            )}
          </>
        )}

        <FailuresOutcomeStatus message={retry.outcome} />

        {hasData && total > 0 && (
          <>
            {read.byState.parked === 0 && (
              <p className="dial-small-text text-secondary">{t(IngestFailuresI18nKey.NothingNeedsRetry)}</p>
            )}

            {read.parked.length < read.byState.parked && (
              <p className="dial-tiny-text text-secondary">
                {t(IngestFailuresI18nKey.ShownOf, { shown: read.parked.length, total: read.byState.parked })}
              </p>
            )}

            {selection.targets.length > 0 && (
              <IngestFailuresSelectionBar
                count={selection.targets.length}
                isBusy={retry.isBusy}
                onClear={selection.clear}
                onRetry={onRetrySelected}
              />
            )}

            {groups.length > 0 && (
              <IngestFailuresGrid
                groups={groups}
                isPending={false}
                selected={selection.keys}
                isBusy={retry.isBusy}
                now={now}
                onToggleSelect={selection.toggle}
                onSelectGroup={selection.selectGroup}
                onRetryOne={onRetryOne}
                onRetryGroup={(group) => void onRetryGroup(group)}
              />
            )}

            {read.byState.pending > 0 && (
              <IngestFailuresPendingList failures={read.pending} count={read.byState.pending} now={now} />
            )}
          </>
        )}
      </div>

      {pending && (
        <IngestRetryConfirm
          count={pending.count}
          isDeterministic={pending.isDeterministic}
          runId={pending.group ? runId : undefined}
          onConfirm={onConfirm}
          onClose={() => setPending(null)}
        />
      )}
    </BackfillDrawer>
  );
};

export default IngestFailuresDrawer;
