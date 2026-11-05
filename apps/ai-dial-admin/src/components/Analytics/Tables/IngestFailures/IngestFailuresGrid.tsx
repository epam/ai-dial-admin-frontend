'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ButtonVariant, Checkbox, EllipsisTooltip, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModelUpdatedEvent,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClassParams,
  RowHeightParams,
} from 'ag-grid-community';

import IngestFailureDetail from '@/src/components/Analytics/Tables/IngestFailures/IngestFailureDetail';
import IngestFailureGroupHeader from '@/src/components/Analytics/Tables/IngestFailures/IngestFailureGroupHeader';
import {
  IngestFailureGroup,
  IngestFailureRow,
  IngestFailureRowType,
} from '@/src/components/Analytics/Tables/IngestFailures/models';
import { useMeasuredRows } from '@/src/components/Analytics/Common/Failures/use-measured-rows';
import { failureKey, subjectName } from '@/src/components/Analytics/Tables/IngestFailures/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import VisuallyHiddenHeader from '@/src/components/Grid/HeaderComponents/VisuallyHiddenHeader';
import { HEADER_HEIGHT, ROW_HEIGHT } from '@/src/components/Grid/constants';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IngestFailure } from '@/src/models/analytics/ingest-failure';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

const SELECT_COLUMN = 'select';
const DETAILS_COLUMN = 'details';
const RETRY_COLUMN = 'retry';
const AGE_COLUMN = 'lastFailed';
const ACTION_COLUMNS = new Set([SELECT_COLUMN, DETAILS_COLUMN, RETRY_COLUMN]);

const GROUP_PLACEHOLDER_HEIGHT = 88;
const DETAIL_PLACEHOLDER_HEIGHT = 320;
const MAX_GRID_HEIGHT_PX = 560;
const GRID_BORDERS_PX = 2;

interface Props {
  groups: IngestFailureGroup[];
  isPending: boolean;
  selected: Set<string>;
  isBusy: boolean;
  now: number;
  onToggleSelect: (failure: IngestFailure, isSelected: boolean) => void;
  onSelectGroup: (group: IngestFailureGroup, isSelected: boolean) => void;
  onRetryOne: (failure: IngestFailure) => void;
  onRetryGroup: (group: IngestFailureGroup) => void;
}

const getRowId = (params: { data: IngestFailureRow }): string => params.data.rowId;

const isFullWidthRow = (params: IsFullWidthRowParams<IngestFailureRow>): boolean =>
  params.rowNode.data?.type !== IngestFailureRowType.Failure;

const getRowClass = (params: RowClassParams<IngestFailureRow>): string | undefined =>
  params.data?.type === IngestFailureRowType.Failure ? 'cursor-pointer' : undefined;

const placeholderHeight = (row?: IngestFailureRow): number => {
  if (row?.type === IngestFailureRowType.Group) return GROUP_PLACEHOLDER_HEIGHT;
  if (row?.type === IngestFailureRowType.Detail) return DETAIL_PLACEHOLDER_HEIGHT;

  return ROW_HEIGHT;
};

const NO_FILTER = { sortable: false, filter: false, floatingFilter: false };

const HIDDEN_HEADER = { headerComponentParams: { innerHeaderComponent: VisuallyHiddenHeader } };

const IngestFailuresGrid: FC<Props> = ({
  groups,
  isPending,
  selected,
  isBusy,
  now,
  onToggleSelect,
  onSelectGroup,
  onRetryOne,
  onRetryGroup,
}) => {
  const t = useI18n();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [rowsHeight, setRowsHeight] = useState<number | null>(null);
  const observeRow = useMeasuredRows(gridApi);

  const onToggleRow = useCallback((failure: IngestFailure) => {
    const key = failureKey(failure);
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const live = useRef({ now, isBusy, expandedKey, selected, onToggleSelect, onRetryOne, onToggleRow });
  live.current = { now, isBusy, expandedKey, selected, onToggleSelect, onRetryOne, onToggleRow };

  useEffect(() => {
    const isStillListed = groups.some((group) => group.failures.some((failure) => failureKey(failure) === expandedKey));
    if (expandedKey && !isStillListed) setExpandedKey(null);
  }, [groups, expandedKey]);

  const rowData = useMemo<IngestFailureRow[]>(
    () =>
      groups.flatMap((group) => {
        const header: IngestFailureRow[] = isPending
          ? []
          : [{ rowId: `group:${group.key}`, type: IngestFailureRowType.Group, group }];

        return header.concat(
          group.failures.flatMap((failure) => {
            const key = failureKey(failure);
            const row: IngestFailureRow = { rowId: key, type: IngestFailureRowType.Failure, group, failure };

            return expandedKey === key
              ? [row, { rowId: `${key}:detail`, type: IngestFailureRowType.Detail, group, failure }]
              : [row];
          }),
        );
      }),
    [groups, isPending, expandedKey],
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    const selectColumn: ColDef = {
      ...NO_FILTER,
      colId: SELECT_COLUMN,
      ...HIDDEN_HEADER,
      headerName: t(IngestFailuresI18nKey.Select),
      width: 48,
      maxWidth: 48,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<IngestFailureRow>) => {
        const failure = params.data?.failure;
        if (!failure) return null;

        return (
          <span className="flex size-full items-center justify-center">
            <Checkbox
              aria-label={t(IngestFailuresI18nKey.SelectRow, { subject: subjectName(failure) })}
              isSelected={live.current.selected.has(failureKey(failure))}
              disabled={live.current.isBusy}
              onChange={(value) => live.current.onToggleSelect(failure, value)}
            />
          </span>
        );
      },
    };

    const detailsColumn: ColDef = {
      ...NO_FILTER,
      colId: DETAILS_COLUMN,
      ...HIDDEN_HEADER,
      headerName: t(IngestFailuresI18nKey.Details),
      width: 48,
      maxWidth: 48,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<IngestFailureRow>) => {
        const failure = params.data?.failure;
        if (!failure) return null;
        const isOpen = live.current.expandedKey === failureKey(failure);

        return (
          <button
            type="button"
            className="flex size-full items-center justify-center text-secondary hover:text-primary focus-visible:text-primary"
            aria-expanded={isOpen}
            aria-label={t(isOpen ? IngestFailuresI18nKey.HideRow : IngestFailuresI18nKey.ShowRow)}
            onClick={() => live.current.onToggleRow(failure)}
          >
            {isOpen ? (
              <IconChevronDown {...BASE_BUTTON_ICON_PROPS} aria-hidden />
            ) : (
              <IconChevronRight {...BASE_BUTTON_ICON_PROPS} aria-hidden />
            )}
          </button>
        );
      },
    };

    const subjectColumn: ColDef = {
      ...NO_FILTER,
      colId: 'subject',
      headerName: t(IngestFailuresI18nKey.Subject),
      flex: 1,
      minWidth: 96,
      cellRenderer: (params: ICellRendererParams<IngestFailureRow>) => {
        const failure = params.data?.failure;

        return failure ? <EllipsisTooltip text={subjectName(failure)} /> : null;
      },
    };

    const dayColumn: ColDef = {
      ...NO_FILTER,
      colId: 'day',
      headerName: t(IngestFailuresI18nKey.Day),
      width: 104,
      maxWidth: 104,
      flex: 0,
      valueGetter: (params) => (params.data as IngestFailureRow | undefined)?.failure?.day,
    };

    const nextAttemptColumn: ColDef = {
      ...NO_FILTER,
      colId: 'nextAttempt',
      headerName: t(IngestFailuresI18nKey.NextAttempt),
      width: 152,
      maxWidth: 168,
      flex: 0,
      valueGetter: (params) =>
        formatDateTimeToLocalString((params.data as IngestFailureRow | undefined)?.failure?.next_attempt_at),
    };

    const ageColumn: ColDef = {
      ...NO_FILTER,
      colId: AGE_COLUMN,
      headerName: t(IngestFailuresI18nKey.LastFailed),
      width: 96,
      maxWidth: 104,
      flex: 0,
      valueGetter: (params) => (params.data as IngestFailureRow | undefined)?.failure?.last_failed_at,
      valueFormatter: (params) => formatRelativeTime(params.value ?? null, live.current.now),
    };

    const retryColumn: ColDef = {
      ...NO_FILTER,
      colId: RETRY_COLUMN,
      headerName: t(IngestFailuresI18nKey.Actions),
      width: 96,
      maxWidth: 96,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<IngestFailureRow>) => {
        const failure = params.data?.failure;
        if (!failure) return null;

        return (
          <span className="flex size-full items-center justify-end">
            <Button
              variant={ButtonVariant.Primary}
              size={ElementSize.Small}
              label={t(IngestFailuresI18nKey.Retry)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              disabled={live.current.isBusy}
              onClick={() => live.current.onRetryOne(failure)}
            />
          </span>
        );
      },
    };

    return isPending
      ? [detailsColumn, subjectColumn, dayColumn, ageColumn, nextAttemptColumn]
      : [selectColumn, detailsColumn, subjectColumn, dayColumn, ageColumn, retryColumn];
  }, [t, isPending]);

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.refreshCells({ columns: [SELECT_COLUMN, DETAILS_COLUMN, RETRY_COLUMN, AGE_COLUMN], force: true });
    }
  }, [gridApi, now, isBusy, expandedKey, selected]);

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<IngestFailureRow>) => {
      const row = params.data;
      if (!row) return null;

      if (row.type === IngestFailureRowType.Group) {
        const selectedCount = row.group.failures.filter((failure) => selected.has(failureKey(failure))).length;

        return (
          <div ref={observeRow(params.node)}>
            <IngestFailureGroupHeader
              group={row.group}
              selectedCount={selectedCount}
              isBusy={isBusy}
              onSelectGroup={onSelectGroup}
              onRetryGroup={onRetryGroup}
            />
          </div>
        );
      }

      return row.failure ? (
        <div ref={observeRow(params.node)}>
          <IngestFailureDetail failure={row.failure} />
        </div>
      ) : null;
    },
    [observeRow, selected, isBusy, onSelectGroup, onRetryGroup],
  );

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    const row = event.data as IngestFailureRow | undefined;
    if (!row?.failure || row.type !== IngestFailureRowType.Failure) return;
    if (ACTION_COLUMNS.has(event.column.getColId())) return;

    live.current.onToggleRow(row.failure);
  }, []);

  const getRowHeight = useCallback(
    (params: RowHeightParams<IngestFailureRow>) =>
      params.data?.type === IngestFailureRowType.Failure
        ? ROW_HEIGHT
        : (params.node.rowHeight ?? placeholderHeight(params.data)),
    [],
  );

  const onModelUpdated = useCallback(({ api }: ModelUpdatedEvent) => {
    let height = 0;
    api.forEachNode((node) => {
      height += node.rowHeight ?? 0;
    });
    setRowsHeight(height);
  }, []);

  const additionalGridOptions = useMemo(
    () => ({ isFullWidthRow, fullWidthCellRenderer, onCellClicked, getRowClass, getRowHeight, onModelUpdated }),
    [fullWidthCellRenderer, onCellClicked, getRowHeight, onModelUpdated],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => setGridApi(event.api), []);

  const contentHeight =
    HEADER_HEIGHT + GRID_BORDERS_PX + (rowsHeight ?? rowData.reduce((sum, row) => sum + placeholderHeight(row), 0));

  return (
    <div className="w-full" style={{ height: Math.min(MAX_GRID_HEIGHT_PX, contentHeight) }}>
      <GridView<IngestFailureRow>
        rowData={rowData}
        columnDefs={columnDefs}
        isLiveData
        onGridReady={onGridReady}
        getRowId={getRowId}
        additionalGridOptions={additionalGridOptions}
      />
    </div>
  );
};

export default IngestFailuresGrid;
