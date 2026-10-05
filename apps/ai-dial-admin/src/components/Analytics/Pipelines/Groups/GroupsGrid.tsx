'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import GridView from '@/src/components/Grid/GridView/GridView';
import GroupKey from '@/src/components/Analytics/Pipelines/Groups/GroupKey';
import GroupStateBadge from '@/src/components/Analytics/Pipelines/Groups/GroupStateBadge';
import { evaluationsToday, isAtCeiling, nextUtcMidnight } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { formatRelativeTime, formatSessionDuration } from '@/src/utils/analytics/session-formatting';

/** One grid row: the runner's facts and the state the tab derived from them at its last tick. */
export interface GroupRow {
  group: PipelineGroup;
  state: GroupState;
}

const STATE_COLUMN = 'state';
const LAST_ACTIVITY_COLUMN = 'lastActivity';
const LAST_EVALUATED_COLUMN = 'lastEvaluated';
const EVALUATIONS_COLUMN = 'evaluations';
const ACTIONS_COLUMN = 'actions';

interface Props {
  rows: GroupRow[];
  readyWhen?: ReadyWhen;
  isPaused: boolean;
  isBusy: boolean;
  isLoading: boolean;
  /** The tab's clock, so every age and state on screen moves together. */
  now: number;
  emptyMessage: string;
  onQueue: (group: PipelineGroup) => void;
}

const getRowId = (params: { data: GroupRow }): string => params.data.group.group_key;

/**
 * The pipeline's groups, in the runner's order — oldest activity first.
 *
 * The renderers read everything that changes between renders from a ref and are told to repaint, rather than
 * being handed a new column model on every tick, which would remount every renderer.
 */
const GroupsGrid: FC<Props> = ({ rows, readyWhen, isPaused, isBusy, isLoading, now, emptyMessage, onQueue }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const live = useRef({ now, isBusy, isPaused, readyWhen, onQueue });
  live.current = { now, isBusy, isPaused, readyWhen, onQueue };

  const columnDefs = useMemo<ColDef<GroupRow>[]>(
    () => [
      {
        colId: 'groupKey',
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnKey),
        width: 240,
        flex: 0,
        filter: false,
        floatingFilter: false,
        sortable: false,
        // The key clips itself and reveals the whole value; the grid's own truncation tooltip would be a second one.
        tooltipValueGetter: () => null,
        cellRenderer: (params: ICellRendererParams<GroupRow>) =>
          params.data ? <GroupKey value={params.data.group.group_key} /> : null,
      },
      {
        colId: STATE_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnState),
        width: 140,
        flex: 0,
        filter: false,
        floatingFilter: false,
        sortable: false,
        // The badge carries its own explanation; the grid's truncation tooltip would repeat the label.
        tooltipValueGetter: () => null,
        cellRenderer: (params: ICellRendererParams<GroupRow>) =>
          params.data ? (
            <GroupStateBadge
              group={params.data.group}
              state={params.data.state}
              readyWhen={live.current.readyWhen}
              isPaused={live.current.isPaused}
              now={live.current.now}
            />
          ) : null,
      },
      {
        colId: LAST_ACTIVITY_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnLastActivity),
        minWidth: 140,
        flex: 1,
        filter: false,
        floatingFilter: false,
        sortable: false,
        valueGetter: (params) => params.data?.group.last_activity_at,
        valueFormatter: (params) => formatRelativeTime(params.value ?? null, live.current.now),
        tooltipValueGetter: (params) => params.data?.group.last_activity_at,
      },
      {
        colId: LAST_EVALUATED_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnLastEvaluated),
        minWidth: 140,
        flex: 1,
        filter: false,
        floatingFilter: false,
        sortable: false,
        valueGetter: (params) => params.data?.group.computed_at,
        valueFormatter: (params) =>
          params.value ? formatRelativeTime(params.value, live.current.now) : t(AnalyticsPipelinesI18nKey.GroupsNever),
        tooltipValueGetter: (params) => params.data?.group.computed_at ?? null,
      },
      {
        colId: EVALUATIONS_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnEvaluations),
        width: 160,
        flex: 0,
        filter: false,
        floatingFilter: false,
        sortable: false,
        tooltipValueGetter: () => null,
        cellRenderer: (params: ICellRendererParams<GroupRow>) => {
          if (!params.data) return null;

          const { now: tick, readyWhen } = live.current;
          const used = evaluationsToday(params.data.group, tick);
          const ceiling = readyWhen?.cost_ceiling;

          return (
            <span
              className={classNames(
                'tabular-nums',
                isAtCeiling(params.data.group, readyWhen, tick) && 'font-semibold text-warning',
              )}
            >
              {ceiling == null ? used : `${used} / ${ceiling}`}
            </span>
          );
        },
      },
      {
        colId: ACTIONS_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.GroupsColumnActions),
        width: 190,
        flex: 0,
        filter: false,
        floatingFilter: false,
        sortable: false,
        tooltipValueGetter: () => null,
        cellRenderer: (params: ICellRendererParams<GroupRow>) => {
          const data = params.data;
          // Nothing on a ready group: the runner takes it on its next pass, so there is nothing to hurry.
          if (!data || data.state === GroupState.Ready) return null;

          const label = t(AnalyticsPipelinesI18nKey.GroupsQueue);

          const { now: tick, readyWhen } = live.current;

          // Presented but not operable, and still focusable so the reason is reachable: the runner does not
          // refuse an evaluation past the ceiling, so this control is the guard — for an up-to-date group that
          // has spent today's evaluations as much as for one at cap.
          if (isAtCeiling(data.group, readyWhen, tick)) {
            return (
              <span className="flex size-full items-center">
                <Button
                  variant={ButtonVariant.Primary}
                  size={ElementSize.Small}
                  label={label}
                  aria-disabled
                  className="cursor-not-allowed opacity-50"
                  tooltipProps={{
                    tooltip: t(AnalyticsPipelinesI18nKey.GroupsQueueAtCap, {
                      remaining: formatSessionDuration(nextUtcMidnight(tick) - tick),
                    }),
                  }}
                />
              </span>
            );
          }

          return (
            <span className="flex size-full items-center">
              <Button
                variant={ButtonVariant.Primary}
                size={ElementSize.Small}
                label={label}
                disabled={live.current.isBusy}
                onClick={() => live.current.onQueue(data.group)}
              />
            </span>
          );
        },
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.refreshCells({
        columns: [STATE_COLUMN, LAST_ACTIVITY_COLUMN, LAST_EVALUATED_COLUMN, EVALUATIONS_COLUMN, ACTIONS_COLUMN],
        force: true,
      });
    }
  }, [gridApi, now, isBusy, isPaused, readyWhen, rows]);

  const onGridReady = useCallback((event: GridReadyEvent) => setGridApi(event.api), []);

  return (
    <div className="flex min-h-[240px] flex-1 flex-col">
      <GridView<GroupRow>
        rowData={rows}
        columnDefs={columnDefs}
        isLiveData
        onGridReady={onGridReady}
        getRowId={getRowId}
        getIsEmptyData={() => rows.length === 0 && !isLoading}
        emptyDataProps={{ title: emptyMessage }}
      />
    </div>
  );
};

export default GroupsGrid;
