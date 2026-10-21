'use client';

import {
  ColDef,
  CellClickedEvent,
  CellKeyDownEvent,
  FilterChangedEvent,
  GridApi,
  GridReadyEvent,
  RowClassRules,
  RowClickedEvent,
} from 'ag-grid-community';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ColumnWidths } from '@/src/components/Grid/models';
import DisplayPanel from '@/src/components/Runs/Compare/ExecutionResults/DisplayPanel';
import DiffLegend from '@/src/components/Runs/Compare/ExecutionResults/DiffLegend';
import { compareGridOptions } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
  collectHiddenColIds,
  columnStateFromComparePanelTree,
  deriveCompareGridColDefs,
  haveSameComparePanelLayout,
  reconcileCompareColumns,
  syncComparePanelFromColumnState,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';
import {
  countCompareDiffs,
  hasCompareRowDiff,
  mergeCompareMetricValuesSchema,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { applyCompareColumnMove } from '@/src/components/Runs/Compare/ExecutionResults/utils/compare-column-blocks';
import { getCompareColumnsCompare } from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { CompareRun, ExecutionResultsTabUiState } from '@/src/components/Runs/Compare/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { mapGridColToPivotField } from '@/src/components/Runs/View/RowDetails/map-grid-col-to-pivot-field';
import {
  getCompareRowSelectionId,
  isMatchedCompareRow,
  mergeByTestCaseId,
  RESULT_FILTERS,
} from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  runs: CompareRun[];
  onlyMatchingTestCases: boolean;
  showDisplayPanel: boolean;
  onToggleDisplayPanel: () => void;
  selectedRow: CompareAnalyticsRow | null;
  onOpenRowDetail: (row: CompareAnalyticsRow, options?: { focusFieldKey?: string | null }) => void;
  executionResultsState: ExecutionResultsTabUiState;
  setExecutionResultsState: (patch: Partial<ExecutionResultsTabUiState>) => void;
}

const DISPLAY_PANEL_CLASS_NAME =
  'flex flex-col absolute right-0 top-0 bottom-0 w-[397px] bg-layer-3 border-l border-primary shadow-lg z-20';

const loadRunResults = async (runId: string) => {
  const run = await getRun(runId);
  if (!run) {
    return null;
  }
  return getTestCaseRunResults(RESULT_FILTERS(run));
};

const ExecutionResultsTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  runs,
  onlyMatchingTestCases,
  showDisplayPanel,
  onToggleDisplayPanel,
  selectedRow,
  onOpenRowDetail,
  executionResultsState,
  setExecutionResultsState,
}) => {
  const t = useI18n();

  const gridApiRef = useRef<GridApi | null>(null);
  const cellClickHandledRef = useRef(false);
  const [isGridReady, setIsGridReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const {
    viewDifferencesOnly,
    hideHighlights,
    panelColDefs,
    filterModel,
    columnState,
    columnWidths,
    results,
    comparedResults,
  } = executionResultsState;

  const panelColDefsRef = useRef(panelColDefs);
  panelColDefsRef.current = panelColDefs;
  const columnStateRef = useRef(columnState);
  columnStateRef.current = columnState;

  const errorText = t(RunsI18nKey.MetricFailedText);

  useEffect(() => {
    if (results !== null) {
      return;
    }

    let isCancelled = false;
    setHasLoadError(false);

    loadRunResults(primaryRunId)
      .then((resultsResponse) => {
        if (isCancelled) return;
        if (resultsResponse === null) {
          setHasLoadError(true);
          return;
        }
        setExecutionResultsState({ results: resultsResponse?.content || [] });
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [primaryRunId, results, setExecutionResultsState]);

  useEffect(() => {
    if (comparedResults !== null) {
      return;
    }

    let isCancelled = false;

    loadRunResults(comparedRunId)
      .then((resultsResponse) => {
        if (isCancelled) return;
        if (resultsResponse === null) {
          setHasLoadError(true);
          return;
        }
        setExecutionResultsState({ comparedResults: resultsResponse?.content || [] });
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [comparedRunId, comparedResults, setExecutionResultsState]);

  const mergedRowData = useMemo(() => {
    if (results === null || comparedResults === null) return null;
    const merged = mergeByTestCaseId(results, comparedResults);
    return onlyMatchingTestCases ? merged.filter(isMatchedCompareRow) : merged;
  }, [results, comparedResults, onlyMatchingTestCases]);

  const metricsSchema = useMemo(() => {
    if (!mergedRowData) return {};
    const allResults: AnalyticsResult[] = [
      ...mergedRowData,
      ...mergedRowData.flatMap((row) => (row._compared ? [row._compared] : [])),
    ];
    return mergeCompareMetricValuesSchema(allResults);
  }, [mergedRowData]);

  const computedColDefs = useMemo(() => {
    if (mergedRowData === null) return [];
    return getCompareColumnsCompare(mergedRowData, errorText, t(RunsI18nKey.RunCompareDelta), {
      hideHighlights,
      metricsSchema,
      runs,
    });
  }, [mergedRowData, errorText, t, hideHighlights, metricsSchema, runs]);

  const onCellClicked = useCallback(
    (event: CellClickedEvent<CompareAnalyticsRow>) => {
      if (!event.data) return;
      cellClickHandledRef.current = true;
      const colId = event.column?.getColId() ?? event.colDef?.colId ?? event.colDef?.field ?? null;
      const mappedFieldKey = mapGridColToPivotField(colId);
      onOpenRowDetail(event.data, { focusFieldKey: mappedFieldKey });
    },
    [onOpenRowDetail],
  );

  const onRowClicked = useCallback(
    (event: RowClickedEvent<CompareAnalyticsRow>) => {
      if (!event.data) return;
      if (cellClickHandledRef.current) {
        cellClickHandledRef.current = false;
        return;
      }
      onOpenRowDetail(event.data);
    },
    [onOpenRowDetail],
  );

  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent<CompareAnalyticsRow>) => {
      if ((event.event as KeyboardEvent | undefined)?.key !== 'Enter' || !event.data) return;
      onOpenRowDetail(event.data);
    },
    [onOpenRowDetail],
  );

  const displayColDefs = useMemo(() => {
    if (!panelColDefs.length) {
      return computedColDefs;
    }
    return deriveCompareGridColDefs(panelColDefs, columnState, computedColDefs as ColDef[]);
  }, [panelColDefs, columnState, computedColDefs]);
  const displayColDefsRef = useRef(displayColDefs);
  displayColDefsRef.current = displayColDefs;

  useEffect(() => {
    if (!computedColDefs.length) {
      return;
    }

    const { panelColDefs: nextPanelColDefs } = reconcileCompareColumns({
      schemaColDefs: computedColDefs as ColDef[],
      runs,
      previousPanelColDefs: panelColDefsRef.current,
      columnState: columnStateRef.current,
    });
    if (haveSameComparePanelLayout(panelColDefsRef.current, nextPanelColDefs)) {
      return;
    }
    setExecutionResultsState({ panelColDefs: nextPanelColDefs });
  }, [computedColDefs, runs, setExecutionResultsState]);

  const hiddenColIds = useMemo(() => collectHiddenColIds(displayColDefs), [displayColDefs]);

  const displayedRowData = useMemo(() => {
    if (mergedRowData === null) return null;
    if (!viewDifferencesOnly) return mergedRowData;

    const visibility = { hiddenColIds };
    return mergedRowData.filter((row) => hasCompareRowDiff(row, visibility));
  }, [mergedRowData, viewDifferencesOnly, hiddenColIds]);

  const diffCounts = useMemo(
    () => countCompareDiffs(mergedRowData ?? [], { hiddenColIds }),
    [mergedRowData, hiddenColIds],
  );

  const rowClassRules = useMemo<RowClassRules<CompareAnalyticsRow>>(
    () => ({
      'ag-active-detail-row': (params) => {
        if (!params.data || !selectedRow) return false;
        return getCompareRowSelectionId(params.data) === getCompareRowSelectionId(selectedRow);
      },
    }),
    [selectedRow],
  );

  const syncGridUiState = useCallback(
    (api: GridApi) => {
      setExecutionResultsState({
        filterModel: api.getFilterModel(),
        columnState: api.getColumnState(),
      });
    },
    [setExecutionResultsState],
  );

  const onColumnWidthsChange = useCallback(
    (nextColumnWidths: ColumnWidths) => setExecutionResultsState({ columnWidths: nextColumnWidths }),
    [setExecutionResultsState],
  );

  const gridOptions = useMemo(
    () => ({
      ...compareGridOptions,
      rowHeight: 40,
      rowClassRules,
      onCellClicked,
      onRowClicked,
      onCellKeyDown,
      onFilterChanged: (event: FilterChangedEvent) => {
        syncGridUiState(event.api);
      },
      onSortChanged: (event: { api: GridApi }) => {
        syncGridUiState(event.api);
      },
      onColumnMoved: (event: {
        api: GridApi;
        finished?: boolean;
        source?: string;
        columns?: { getColId: () => string }[] | null;
      }) => {
        // A drag already leaves the grid in its new order. Re-saving orders that
        // applyColumnState or a grid-option refresh emit feeds the restore effect
        // and the two keep swapping the columns.
        if (event.source === 'uiColumnMoved' && event.finished !== false) {
          const movedIds = new Set((event.columns ?? []).map((column) => column.getColId()));
          const nextColumnState = applyCompareColumnMove(event.api, displayColDefsRef.current, movedIds);
          const nextPanelColDefs = syncComparePanelFromColumnState(panelColDefsRef.current, nextColumnState);
          setExecutionResultsState({
            columnState: nextColumnState,
            panelColDefs: nextPanelColDefs,
          });
        }
      },
      onColumnVisible: (event: { api: GridApi }) => {
        syncGridUiState(event.api);
      },
    }),
    [rowClassRules, syncGridUiState, onCellClicked, onRowClicked, onCellKeyDown, setExecutionResultsState],
  );

  useEffect(() => {
    if (!showDisplayPanel || !computedColDefs?.length) {
      return;
    }

    const gridColumnState = columnState?.length ? columnState : gridApiRef.current?.getColumnState();
    if (!gridColumnState?.length) {
      return;
    }

    const prevPanelColDefs = panelColDefsRef.current;
    if (!prevPanelColDefs.length) {
      return;
    }

    const syncedColDefs = syncComparePanelFromColumnState(prevPanelColDefs, gridColumnState);
    if (haveSameComparePanelLayout(prevPanelColDefs, syncedColDefs)) {
      return;
    }

    setExecutionResultsState({ panelColDefs: syncedColDefs });
  }, [showDisplayPanel, computedColDefs, columnState, isGridReady, setExecutionResultsState]);

  const onPanelColumnsChange = useCallback(
    (nestedPanelCols: ColDef[]) => {
      const current = gridApiRef.current?.getColumnState() ?? columnStateRef.current ?? [];
      const nextColumnState = columnStateFromComparePanelTree(nestedPanelCols, current);
      const nextPanelColDefs = nextColumnState.length
        ? syncComparePanelFromColumnState(nestedPanelCols, nextColumnState)
        : nestedPanelCols;

      setExecutionResultsState({
        panelColDefs: nextPanelColDefs,
        ...(nextColumnState.length ? { columnState: nextColumnState } : {}),
      });
      requestAnimationFrame(() => {
        const api = gridApiRef.current;
        if (!api || api.isDestroyed()) {
          return;
        }
        api.sizeColumnsToFit();
      });
    },
    [setExecutionResultsState],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
    setIsGridReady(true);
  }, []);

  // Restore after AgGridWrapper's setGridColumnsState (child effect runs first).
  useEffect(() => {
    const api = gridApiRef.current;
    // An empty result replaces the grid, so this ref still points at the destroyed API.
    if (api?.isDestroyed()) {
      gridApiRef.current = null;
      if (isGridReady) {
        setIsGridReady(false);
      }
      return;
    }
    if (!isGridReady || !api) {
      return;
    }

    if (filterModel && Object.keys(filterModel).length > 0) {
      const current = api.getFilterModel() ?? {};
      const isAlreadyApplied = Object.keys(filterModel).every(
        (key) => JSON.stringify(current[key]) === JSON.stringify(filterModel[key]),
      );
      if (!isAlreadyApplied) {
        api.setFilterModel(filterModel);
      }
    }

    const stateToRestore = columnStateRef.current;
    if (stateToRestore?.length) {
      const liveColumns = api.getColumnState();
      if (!liveColumns) {
        return;
      }
      const liveOrder = liveColumns.map((column) => column.colId).join(',');
      const applyOrder = stateToRestore.map((column) => column.colId).join(',');
      if (liveOrder !== applyOrder) {
        api.applyColumnState({ state: stateToRestore, applyOrder: true });
      }
    }
  }, [isGridReady, filterModel, displayColDefs]);

  const isCompareDataReady = results !== null && comparedResults !== null;

  if (hasLoadError) {
    return <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>;
  }

  if (!isCompareDataReady) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <GridView
          key={`${primaryRunId}-${comparedRunId}`}
          columnDefs={displayColDefs}
          columnWidths={columnWidths}
          onColumnWidthsChange={onColumnWidthsChange}
          rowData={displayedRowData}
          additionalGridOptions={gridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          onGridReady={onGridReady}
        />
        {showDisplayPanel && (
          <div className={classNames('absolute inset-0 flex bg-blackout z-[15]')}>
            <DisplayPanel
              columns={panelColDefs}
              onColumnsChange={onPanelColumnsChange}
              viewDifferencesOnly={viewDifferencesOnly}
              onViewDifferencesOnlyChange={(value) => setExecutionResultsState({ viewDifferencesOnly: value })}
              hideHighlights={hideHighlights}
              onHideHighlightsChange={(value) => setExecutionResultsState({ hideHighlights: value })}
              onClose={onToggleDisplayPanel}
              panelClassName={DISPLAY_PANEL_CLASS_NAME}
            />
          </div>
        )}
      </div>

      {!selectedRow && <DiffLegend counts={diffCounts} />}
    </div>
  );
};

export default ExecutionResultsTab;
