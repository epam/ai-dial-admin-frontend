'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import {
  BodyScrollEvent,
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IRowNode,
  IsFullWidthRowParams,
  RowClassParams,
  RowHeightParams,
} from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import FailureRowDetail from '@/src/components/Analytics/Pipelines/Failures/FailureRowDetail';
import FailuresFilterBar from '@/src/components/Analytics/Pipelines/Failures/FailuresFilterBar';
import { isRetryable, visibleFailures } from '@/src/components/Analytics/Pipelines/Failures/failures';
import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { HEADER_HEIGHT, ROW_HEIGHT } from '@/src/components/Grid/constants';
import { DLQ_GRID_MAX_HEIGHT_PX, DLQ_STAGE_COLOR } from '@/src/constants/analytics/pipeline-dlq';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DlqItem, DlqLane } from '@/src/models/analytics/pipeline-dlq';
import { TriggerKind } from '@/src/models/analytics/pipeline';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

/** One grid row: a failure, or the detail opened under it. */
interface FailureRow {
  rowId: string;
  item: DlqItem;
  isDetail: boolean;
}

/** The two columns whose cells carry their own action and therefore do not open the detail. */
const DETAILS_COLUMN = 'details';
const RETRY_COLUMN = 'retry';

/** How few rows may remain below the viewport before the next page is asked for. */
const LOAD_MORE_MARGIN_ROWS = 3;

/** What a detail row occupies until it has measured itself, so the first paint is not a sliver. */
const DETAIL_PLACEHOLDER_HEIGHT = 240;

interface Props {
  failures: PipelineFailuresRead;
  trigger?: TriggerKind;
  search: string;
  isBusy: boolean;
  /** The card's clock, so every age on screen moves together. */
  now: number;
  onSearchChange: (term: string) => void;
  onRetryOne: (id: number) => void;
  onRetryRun: (runId: string, count: number) => void;
}

const detailRowId = (item: DlqItem): string => `${item.id}-detail`;

const getRowId = (params: { data: FailureRow }): string => params.data.rowId;

const isFullWidthRow = (params: IsFullWidthRowParams<FailureRow>): boolean => Boolean(params.rowNode.data?.isDetail);

const getRowClass = (params: RowClassParams<FailureRow>): string | undefined =>
  params.data?.isDetail ? undefined : 'cursor-pointer';

/**
 * The failures, listed inside the card.
 *
 * Detail rows are injected into the row data and matched by `isFullWidthRow`, the pattern `SchemaGrid`
 * already uses — ag-grid's own master/detail is an Enterprise feature this repo does not have, and the
 * full-width row is the community equivalent. A full-width row has no automatic height, so the grid
 * observes the one it rendered and tells ag-grid what it came out as; the detail itself stays ordinary
 * presentation that knows nothing about any of this.
 *
 * The listing is paged. A scroll near the bottom asks the service for the next page and appends it,
 * and an explicit control does the same for a listing too short to scroll — so the card holds what the
 * reader has actually looked at rather than everything the pipeline ever dead-lettered.
 */
const FailuresGrid: FC<Props> = ({
  failures,
  trigger,
  search,
  isBusy,
  now,
  onSearchChange,
  onRetryOne,
  onRetryRun,
}) => {
  const t = useI18n();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [runRetryable, setRunRetryable] = useState<Record<string, number>>({});
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Read by the one resize observer below, which must not be rebuilt when the api arrives.
  const apiRef = useRef<GridApi | null>(null);
  apiRef.current = gridApi;

  const { items, filters, hasFailed, hasMore, isLoading, isLoadingMore, loadMore, setLane, setRun, readRunRetryable } =
    failures;

  // Nothing about the listing is stated while the read is the thing that failed: the card says so
  // above, and an empty grid beneath it saying "no failures" is the opposite conclusion.
  const isSilent = hasFailed;

  // What the cell renderers read without being rebuilt. The column definitions are built once per
  // locale; handing ag-grid a new array on every clock tick rebuilt its whole column model, remounted
  // every renderer and re-applied the default sort over whichever one the reader had chosen.
  const live = useRef({ now, isBusy, expandedId, onRetryOne, onToggle: (_item: DlqItem) => {} });
  live.current.now = now;
  live.current.isBusy = isBusy;
  live.current.expandedId = expandedId;
  live.current.onRetryOne = onRetryOne;

  const visible = useMemo(() => visibleFailures(items, search), [items, search]);

  const onToggleRow = useCallback((item: DlqItem) => {
    setExpandedId((prev) => (prev === item.id ? null : item.id));
  }, []);

  live.current.onToggle = onToggleRow;

  // A row that leaves the listing — re-run, filtered out, or swept — must not leave its detail behind.
  useEffect(() => {
    if (expandedId != null && !visible.some((item) => item.id === expandedId)) setExpandedId(null);
  }, [visible, expandedId]);

  /** The run of the row that is open, if it has one. The only input the count read depends on. */
  const openRunId = useMemo(
    () => visible.find((item) => item.id === expandedId)?.run_id ?? undefined,
    [visible, expandedId],
  );

  // A re-run changes every run's population, so a count taken before one is no longer true. Dropped
  // whenever the listing is replaced rather than kept for the life of the grid: a stale count had the
  // control and its confirmation disagree again, and made the outcome line report a shortfall of its
  // own making.
  useEffect(() => setRunRetryable({}), [items]);

  // The run's own population, asked of the service once per run the reader opens. Counting it from
  // the rows would count the page, and the control and its confirmation would then quote two numbers.
  // Keyed on the run alone: keyed on the visible rows it re-fired on every keystroke, cancelling its
  // own request each time, so on a slow link the count never settled and the control never appeared.
  useEffect(() => {
    if (!openRunId || runRetryable[openRunId] != null) return;

    let isCurrent = true;

    void readRunRetryable(openRunId).then((count) => {
      if (isCurrent && count != null) setRunRetryable((prev) => ({ ...prev, [openRunId]: count }));
    });

    return () => {
      isCurrent = false;
    };
    // `runRetryable` is read as a cache, not depended on: listing it would re-run this effect on the
    // very write it makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRunId, readRunRetryable]);

  const rowData = useMemo<FailureRow[]>(
    () =>
      visible.flatMap((item) => {
        const row: FailureRow = { rowId: String(item.id), item, isDetail: false };

        return expandedId === item.id ? [row, { rowId: detailRowId(item), item, isDetail: true }] : [row];
      }),
    [visible, expandedId],
  );

  /**
   * Sizes the detail row from what it actually rendered.
   *
   * A `ResizeObserver` rather than a measurement on every render: it reports only when the box really
   * changes — the timestamp landing after mount, a reflow when the card's scrollbar appears — and it
   * does so off the render path, so nothing forces a synchronous layout to find out.
   *
   * **One** observer for the grid, disconnected when the grid goes, with each element's row node in a
   * weak map rather than captured — which is what lets the ref callback stay stable across renders.
   * One observer per detail row leaked them instead, since nothing disconnected the ones a closed row
   * left behind.
   */
  const detailNodes = useRef(new WeakMap<Element, IRowNode>());
  const detailObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      let isChanged = false;

      for (const entry of entries) {
        const node = detailNodes.current.get(entry.target);
        const height = Math.ceil(entry.contentRect.height);
        if (!node || !height || node.rowHeight === height) continue;

        node.setRowHeight(height);
        isChanged = true;
      }

      if (isChanged && !apiRef.current?.isDestroyed()) apiRef.current?.onRowHeightChanged();
    });

    detailObserver.current = observer;

    return () => observer.disconnect();
  }, []);

  /**
   * React 19 runs the function a ref callback returns when the element goes, with the element still
   * in hand — the only moment an `unobserve` is possible. Without it the observer held on to every
   * detail element it had ever seen, and through the weak map to their row nodes with them.
   */
  const observeDetail = useCallback(
    (node: IRowNode) => (element: HTMLDivElement | null) => {
      if (!element) return;

      detailNodes.current.set(element, node);
      detailObserver.current?.observe(element);

      return () => detailObserver.current?.unobserve(element);
    },
    [],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        colId: DETAILS_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.FailuresDetails),
        width: 80,
        maxWidth: 80,
        flex: 0,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<FailureRow>) => {
          const data = params.data;
          if (!data) return null;
          const isOpen = live.current.expandedId === data.item.id;

          return (
            <button
              type="button"
              className="flex size-full items-center justify-center text-secondary hover:text-primary focus-visible:text-primary"
              aria-expanded={isOpen}
              aria-label={t(
                isOpen ? AnalyticsPipelinesI18nKey.FailuresHideRow : AnalyticsPipelinesI18nKey.FailuresShowRow,
              )}
              onClick={() => live.current.onToggle(data.item)}
            >
              {isOpen ? (
                <IconChevronDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              ) : (
                <IconChevronRight {...BASE_BUTTON_ICON_PROPS} aria-hidden />
              )}
            </button>
          );
        },
      },
      {
        colId: 'failedAt',
        headerName: t(AnalyticsPipelinesI18nKey.FailuresFailedAt),
        width: 140,
        maxWidth: 160,
        flex: 0,
        filter: false,
        floatingFilter: false,
        sort: 'desc',
        valueGetter: (params) => (params.data as FailureRow | undefined)?.item.created_at,
        valueFormatter: (params) => formatRelativeTime(params.value ?? null, live.current.now),
        // The exact instant is in the row's detail, which is how a keyboard reader reaches it; this
        // only saves a mouse user the expansion.
        tooltipValueGetter: (params) => (params.data as FailureRow | undefined)?.item.created_at,
      },
      {
        colId: 'stage',
        headerName: t(AnalyticsPipelinesI18nKey.FailuresStage),
        width: 160,
        maxWidth: 180,
        flex: 0,
        filter: false,
        floatingFilter: false,
        valueGetter: (params) => (params.data as FailureRow | undefined)?.item.stage,
        cellRenderer: (params: ICellRendererParams<FailureRow>) => {
          const name = params.data?.item.stage;
          if (!name) return null;

          return (
            <span className="flex flex-row items-center gap-x-2">
              <span className={`size-2 shrink-0 rounded-full ${DLQ_STAGE_COLOR[name]}`} aria-hidden />
              <span className="font-mono">{name}</span>
            </span>
          );
        },
      },
      {
        colId: 'error',
        headerName: t(AnalyticsPipelinesI18nKey.FailuresError),
        flex: 1,
        minWidth: 240,
        sortable: false,
        filter: false,
        floatingFilter: false,
        valueGetter: (params) => (params.data as FailureRow | undefined)?.item.error ?? '',
        tooltipValueGetter: (params) => (params.data as FailureRow | undefined)?.item.error ?? '',
      },
      {
        colId: RETRY_COLUMN,
        headerName: t(AnalyticsPipelinesI18nKey.FailuresActions),
        width: 110,
        maxWidth: 110,
        flex: 0,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params: ICellRendererParams<FailureRow>) => {
          const item = params.data?.item;
          // Nothing rather than a disabled control: a row the service stored no payload for is not one
          // whose retry is temporarily unavailable, it is one that has no retry.
          if (!item || !isRetryable(item)) return null;

          return (
            <span className="flex size-full items-center justify-end">
              <Button
                variant={ButtonVariant.Primary}
                size={ElementSize.Small}
                label={t(AnalyticsPipelinesI18nKey.FailuresRetry)}
                iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                disabled={live.current.isBusy}
                onClick={() => live.current.onRetryOne(item.id)}
              />
            </span>
          );
        },
      },
    ],
    [t],
  );

  // The renderers read the clock, the busy flag and the open row from a ref, so the grid is told to
  // repaint those cells rather than being handed a new column model.
  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.refreshCells({ columns: ['failedAt', DETAILS_COLUMN, RETRY_COLUMN], force: true });
    }
  }, [gridApi, now, isBusy, expandedId]);

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<FailureRow>) => {
      const data = params.data;
      if (!data?.isDetail) return null;

      return (
        <div ref={observeDetail(params.node)}>
          <FailureRowDetail
            item={data.item}
            trigger={trigger}
            filteredRunId={filters.runId}
            isBusy={isBusy}
            runRetryableCount={data.item.run_id ? runRetryable[data.item.run_id] : undefined}
            onFilterByRun={setRun}
            onRetryRun={onRetryRun}
          />
        </div>
      );
    },
    [observeDetail, trigger, filters.runId, isBusy, runRetryable, setRun, onRetryRun],
  );

  // The whole row opens the detail — except the two cells that carry their own control. Decided on the
  // cell rather than by stopping the click: ag-grid listens on the row element itself, below React's
  // root, so a synthetic `stopPropagation` never reaches it, and a chevron left in both handlers
  // toggled twice and cancelled itself out.
  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      const data = event.data as FailureRow | undefined;
      const column = event.column.getColId();
      if (!data || data.isDetail || column === RETRY_COLUMN || column === DETAILS_COLUMN) return;

      onToggleRow(data.item);
    },
    [onToggleRow],
  );

  const getRowHeight = useCallback(
    (params: RowHeightParams<FailureRow>) =>
      params.data?.isDetail ? (params.node.rowHeight ?? DETAIL_PLACEHOLDER_HEIGHT) : ROW_HEIGHT,
    [],
  );

  /** A scroll that comes within a few rows of the end asks for the next page. */
  const onBodyScroll = useCallback(
    // The event's own api rather than the one captured on ready: it is the grid that fired, and it
    // is alive by construction.
    ({ api }: BodyScrollEvent) => {
      if (api.getLastDisplayedRowIndex() < api.getDisplayedRowCount() - LOAD_MORE_MARGIN_ROWS) return;

      void loadMore();
    },
    [loadMore],
  );

  const additionalGridOptions = useMemo(
    () => ({
      isFullWidthRow,
      fullWidthCellRenderer,
      onCellClicked,
      onBodyScroll,
      getRowClass,
      getRowHeight,
    }),
    [fullWidthCellRenderer, onCellClicked, onBodyScroll, getRowHeight],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => setGridApi(event.api), []);

  // Its own rows, up to the bound. A detail row is taller than the estimate allows for, which only
  // means the grid starts scrolling a little sooner — it owns that scrollbar itself.
  const gridHeight = Math.min(DLQ_GRID_MAX_HEIGHT_PX, HEADER_HEIGHT + Math.max(visible.length, 1) * ROW_HEIGHT);

  const isSearchEmpty = visible.length === 0 && items.length > 0;
  const isRunEmpty = items.length === 0 && Boolean(filters.runId);
  const isLaneEmpty = items.length === 0 && Boolean(filters.lane);

  const emptyMessage = (): string => {
    if (isSearchEmpty) return t(AnalyticsPipelinesI18nKey.FailuresNoMatch);
    if (isRunEmpty) return t(AnalyticsPipelinesI18nKey.FailuresNoneInRun);
    if (filters.lane === DlqLane.Live) return t(AnalyticsPipelinesI18nKey.FailuresNoneLive);
    if (isLaneEmpty) return t(AnalyticsPipelinesI18nKey.FailuresNonePath);

    return t(AnalyticsPipelinesI18nKey.FailuresNone);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Frozen while a re-run is in flight: its re-read is bound to the filters it started under, so
          a filter changed meanwhile would be answered by the older request and silently overwritten. */}
      <FailuresFilterBar
        filters={filters}
        search={search}
        isDisabled={isBusy}
        onLaneChange={setLane}
        onRunChange={setRun}
        onSearchChange={onSearchChange}
      />

      {/* A real height rather than `autoHeight`, which switches ag-grid's virtualization off and
          keeps every page ever loaded in the DOM. Sized to its own rows up to the bound, so a short
          listing is not three rows floating in six hundred pixels. */}
      <div className="w-full" style={{ height: gridHeight }}>
        <GridView<FailureRow>
          rowData={rowData}
          columnDefs={columnDefs}
          isLiveData
          onGridReady={onGridReady}
          getRowId={getRowId}
          getIsEmptyData={() => visible.length === 0 && !isLoading && !isSilent}
          emptyDataProps={{ title: emptyMessage() }}
          additionalGridOptions={additionalGridOptions}
        />
      </div>

      {/* The reason, and the way out of it. The reason is repeated here rather than left to the grid's
          own empty state: that one is drawn by `DialNoDataContent`, which is not a live region, so a
          reader who narrowed the list would be told nothing about what the narrowing did. An empty path
          offers no way out of its own: the path select that narrowed it sits right above. */}
      {visible.length === 0 && !isLoading && !isSilent && (
        <div className="flex flex-row flex-wrap items-center gap-3" role="status" aria-live="polite">
          <span className="sr-only">{emptyMessage()}</span>
          {isSearchEmpty && (
            <Button
              variant={ButtonVariant.Neutral}
              size={ElementSize.Small}
              label={t(AnalyticsPipelinesI18nKey.FailuresClearFilters)}
              onClick={() => onSearchChange('')}
            />
          )}
          {isRunEmpty && (
            <Button
              variant={ButtonVariant.Neutral}
              size={ElementSize.Small}
              label={t(AnalyticsPipelinesI18nKey.FailuresClearRun)}
              onClick={() => setRun(undefined)}
            />
          )}
        </div>
      )}

      {/* Scrolling is the usual way to the next page, but a search can narrow the listing below the
          height that scrolls at all — and the search runs over the loaded pages only, so without this
          the rest of them would be unreachable with `hasMore` still true. */}
      {visible.length > 0 && hasMore && (
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          className="self-start"
          label={t(AnalyticsPipelinesI18nKey.FailuresLoadMore)}
          disabled={isLoadingMore}
          onClick={() => void loadMore()}
        />
      )}

      {visible.length > 0 && (
        <span className="dial-tiny-text text-secondary" role="status" aria-live="polite">
          {isLoadingMore
            ? t(AnalyticsPipelinesI18nKey.FailuresLoadingMore)
            : t(AnalyticsPipelinesI18nKey.FailuresShownSoFar, { count: visible.length })}
          {hasMore ? '' : ` ${t(AnalyticsPipelinesI18nKey.FailuresAllLoaded)}`}
        </span>
      )}
    </div>
  );
};

export default FailuresGrid;
