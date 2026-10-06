'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import GroupsFilterBar from '@/src/components/Analytics/Pipelines/Groups/GroupsFilterBar';
import GroupsGrid, { GroupRow } from '@/src/components/Analytics/Pipelines/Groups/GroupsGrid';
import QueueGroupEvaluationPopup from '@/src/components/Analytics/Pipelines/Groups/QueueGroupEvaluationPopup';
import ReadinessSummary from '@/src/components/Analytics/Pipelines/Groups/ReadinessSummary';
import { deriveGroupState } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { usePipelineGroups } from '@/src/components/Analytics/Pipelines/Groups/use-pipeline-groups';
import { useQueueGroupEvaluation } from '@/src/components/Analytics/Pipelines/Groups/use-queue-group-evaluation';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useMinuteTick } from '@/src/hooks/use-minute-tick';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';

interface Props {
  pipeline: Pipeline;
  /** A pause stops the runner evaluating groups on its own, but not an evaluation queued from here. */
  isPaused: boolean;
  /** The runner still executes an older revision of the declaration than the one saved. */
  isGenerationBehind: boolean;
}

/**
 * The Groups tab: the pipeline's readiness rule, and the groups the runner tracks judged against it.
 *
 * The rule is the saved declaration, not a pending edit of it — the runner judges the groups by what it synced.
 */
const PipelineGroups: FC<Props> = ({ pipeline, isPaused, isGenerationBehind }) => {
  const t = useI18n();
  const readyWhen = pipeline.trigger?.ready_when;

  const groups = usePipelineGroups(pipeline.name);
  const queue = useQueueGroupEvaluation({ pipelineName: pipeline.name, onQueued: groups.reload });

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<GroupState>();
  const [pending, setPending] = useState<PipelineGroup | null>(null);

  // States are judged against the clock, so a group crosses its idle window while the tab is open.
  const now = useMinuteTick(groups.groups.length > 0);

  const rows = useMemo<GroupRow[]>(
    () => groups.groups.map((group) => ({ group, state: deriveGroupState(group, readyWhen, now).state })),
    [groups.groups, readyWhen, now],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter(
      (row) =>
        (!stateFilter || row.state === stateFilter) && (!term || row.group.group_key.toLowerCase().includes(term)),
    );
  }, [rows, search, stateFilter]);

  const onConfirm = useCallback(() => {
    if (!pending) return;

    const key = pending.group_key;
    setPending(null);
    void queue.queue(key);
  }, [pending, queue]);

  const isFiltered = Boolean(search.trim()) || stateFilter != null;

  const onLoadMore = useCallback(() => void groups.loadMore(), [groups]);

  const emptyMessage =
    rows.length > 0 ? t(AnalyticsPipelinesI18nKey.GroupsNoMatch) : t(AnalyticsPipelinesI18nKey.GroupsEmpty);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-4 pt-4">
      <ReadinessSummary readyWhen={readyWhen} />

      <div className="flex flex-row flex-wrap items-center justify-between gap-3">
        <GroupsFilterBar
          search={search}
          state={stateFilter}
          onSearchChange={setSearch}
          onStateChange={setStateFilter}
        />
        {!groups.hasFailed && !groups.isLoading && (
          <span className="dial-small-text text-secondary">
            {t(AnalyticsPipelinesI18nKey.GroupsTotal, { count: groups.total })}
          </span>
        )}
      </div>

      {/* The runner serves neither the search nor the state filter, so both reach only the pages loaded so far. */}
      {isFiltered && groups.hasMore && (
        <p className="dial-tiny-text text-secondary" role="status">
          {t(AnalyticsPipelinesI18nKey.GroupsLoadedOnly, { count: groups.groups.length })}
        </p>
      )}

      {groups.hasFailed ? (
        <div className="flex flex-row flex-wrap items-center gap-3" role="status">
          <span className="dial-small-text text-error">
            {t(AnalyticsPipelinesI18nKey.GroupsReadFailed)}
            {groups.errorMessage ? `: ${groups.errorMessage}` : ''}
          </span>
          <Button
            variant={ButtonVariant.Neutral}
            appearance={ButtonAppearance.Outlined}
            size={ElementSize.Small}
            label={t(AnalyticsPipelinesI18nKey.GroupsReadAgain)}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            onClick={() => void groups.reload()}
          />
        </div>
      ) : (
        <GroupsGrid
          rows={visible}
          readyWhen={readyWhen}
          isPaused={isPaused}
          isBusy={queue.isBusy}
          isLoading={groups.isLoading}
          now={now}
          emptyMessage={emptyMessage}
          order={groups.order}
          onOrderChange={groups.setOrder}
          onLoadMore={onLoadMore}
          onQueue={setPending}
        />
      )}

      <span role="status" aria-live="polite" className={queue.outcome ? 'dial-small-text text-secondary' : 'sr-only'}>
        {queue.outcome}
      </span>

      {pending && (
        <QueueGroupEvaluationPopup
          group={pending}
          readyWhen={readyWhen}
          isPaused={isPaused}
          isGenerationBehind={isGenerationBehind}
          now={now}
          onConfirm={onConfirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
};

export default PipelineGroups;
