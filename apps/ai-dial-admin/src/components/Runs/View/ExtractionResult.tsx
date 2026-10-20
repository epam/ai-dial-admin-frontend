'use client';

import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery, getMetricSnapshots, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ColumnWidths } from '@/src/components/Grid/models';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
import { mapGridColToPivotField } from '@/src/components/Runs/View/RowDetails/map-grid-col-to-pivot-field';
import { ExecutionResultRowType } from '@/src/components/Runs/ExecutionResults/models';
import {
  projectExecutionResultGroups,
  projectExecutionResultScores,
} from '@/src/components/Runs/ExecutionResults/utils/test-case-groups';
import {
  buildTestCaseScoresQuery,
  parseTestCaseScores,
} from '@/src/components/Runs/ExecutionResults/utils/test-case-scores';
import { ExtractionResultTabUiState } from '@/src/components/Runs/View/models';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { hasVaryingExecutionIndices } from '@/src/utils/evaluation/column-variation';
import { useDetailMode } from './use-detail-mode';
import {
  getAnalyticsColumns,
  getMetricGroupOrder,
  getRowDetailFieldSchema,
  RESULT_FILTERS,
  RUN_FILTER,
  snapshotsToBindingsMap,
} from './utils';

interface Props {
  run: Run;
  extractionResultState: ExtractionResultTabUiState;
  setExtractionResultState: (patch: Partial<ExtractionResultTabUiState>) => void;
}

const ExtractionResultTab: FC<Props> = ({ run, extractionResultState, setExtractionResultState }) => {
  const t = useI18n();
  const {
    isGroupedByTestCase,
    showTreePanel,
    colDefs,
    panelColDefs,
    columnWidths,
    results,
    testCaseScores,
    snapshots,
  } = extractionResultState;
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(new Set());
  const canGroupByTestCase = hasVaryingExecutionIndices(results ?? []);
  const isGroupingEnabled = isGroupedByTestCase && canGroupByTestCase;
  const showTestCaseSummary = isGroupingEnabled || !canGroupByTestCase;
  const metricBindings = useMemo(() => snapshotsToBindingsMap(snapshots), [snapshots]);
  const metricGroupOrder = useMemo(() => getMetricGroupOrder(colDefs ?? []), [colDefs]);
  const fieldSchema = useMemo(() => getRowDetailFieldSchema(results ?? []), [results]);
  const detailMode = useDetailMode(metricBindings, metricGroupOrder, fieldSchema);
  const { openDetail } = detailMode;

  const gridApiRef = useRef<GridApi | null>(null);
  const isLoading = results === null;
  /** Suppress row-click toggle when a cell click already opened/focused detail. */
  const cellClickHandledRef = useRef(false);

  useEffect(() => {
    if (!run?.id || results !== null) {
      return;
    }

    let isCancelled = false;
    const loadResults = async () => {
      const resultsSettled = await getTestCaseRunResults(RESULT_FILTERS(run));
      if (!isCancelled) setExtractionResultState({ results: resultsSettled?.content || [] });
    };
    void loadResults();
    return () => {
      isCancelled = true;
    };
  }, [run, results, setExtractionResultState]);

  useEffect(() => {
    if (!run.id || testCaseScores !== null) return;

    let isCancelled = false;
    const loadScores = async () => {
      try {
        const result = await executeStructuredQuery(buildTestCaseScoresQuery([run.id as string]));
        if (!isCancelled) setExtractionResultState({ testCaseScores: parseTestCaseScores(result) });
      } catch {
        if (!isCancelled) setExtractionResultState({ testCaseScores: [] });
      }
    };
    void loadScores();
    return () => {
      isCancelled = true;
    };
  }, [run.id, testCaseScores, setExtractionResultState]);

  useEffect(() => {
    if (!run?.id || snapshots.length > 0) {
      return;
    }

    let isCancelled = false;
    const loadSnapshots = async () => {
      const data = await getMetricSnapshots(RUN_FILTER(run.id));
      if (!isCancelled) setExtractionResultState({ snapshots: data || [] });
    };
    void loadSnapshots();
    return () => {
      isCancelled = true;
    };
  }, [run?.id, snapshots.length, setExtractionResultState]);

  const onToggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroupKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  const columnOptions = useMemo(
    () => ({
      isGrouped: isGroupingEnabled,
      showTestCaseSummary,
      hasThreshold: run.suiteSnapshot?.overallScoreThreshold != null,
      labels: {
        score: t(RunsI18nKey.ExecutionOverallScore),
        thresholdStatus: t(RunsI18nKey.Threshold),
        notApplicable: t(RunsI18nKey.NotApplicable),
      },
      onToggleGroup,
    }),
    [isGroupingEnabled, showTestCaseSummary, run.suiteSnapshot?.overallScoreThreshold, t, onToggleGroup],
  );

  useEffect(() => {
    if (results === null) return;
    const nextColDefs = getAnalyticsColumns(results, columnOptions);
    setExtractionResultState({ colDefs: nextColDefs, panelColDefs: nextColDefs });
  }, [results, columnOptions, setExtractionResultState]);

  const displayedResults = useMemo(() => {
    if (!results) return results;
    if (isGroupingEnabled) {
      return projectExecutionResultGroups(
        results,
        collapsedGroupKeys,
        testCaseScores ?? [],
        run.id ?? '',
        run.suiteSnapshot?.overallScoreThreshold,
      );
    }
    if (!canGroupByTestCase) {
      return projectExecutionResultScores(
        results,
        testCaseScores ?? [],
        run.id ?? '',
        run.suiteSnapshot?.overallScoreThreshold,
      );
    }
    return results;
  }, [results, isGroupingEnabled, canGroupByTestCase, collapsedGroupKeys, testCaseScores, run.id, run.suiteSnapshot]);

  const panelColDefsRef = useRef(panelColDefs);
  panelColDefsRef.current = panelColDefs;

  useEffect(() => {
    if (!showTreePanel || !colDefs?.length) {
      return;
    }

    const columnState = gridApiRef.current?.getColumnState();
    if (!columnState?.length) {
      return;
    }

    const prevColDefs = panelColDefsRef.current;
    if (!prevColDefs?.length) {
      return;
    }

    const syncedColDefs = applyColumnStateOrderToTreeColDefs(prevColDefs, columnState);
    if (haveTreeColDefsSamePanelState(prevColDefs, syncedColDefs)) {
      return;
    }

    setExtractionResultState({ panelColDefs: syncedColDefs });
  }, [showTreePanel, colDefs, setExtractionResultState]);

  const toggleTreePanel = useCallback(
    () => setExtractionResultState({ showTreePanel: !showTreePanel }),
    [setExtractionResultState, showTreePanel],
  );

  const onPanelColumnsChange = useCallback(
    (newColDefs: ColDef[]) => {
      setExtractionResultState({ panelColDefs: newColDefs, colDefs: newColDefs });
      gridApiRef.current?.setGridOption('columnDefs', newColDefs);
      requestAnimationFrame(() => gridApiRef.current?.sizeColumnsToFit());
    },
    [setExtractionResultState],
  );

  const onColumnWidthsChange = useCallback(
    (nextColumnWidths: ColumnWidths) => setExtractionResultState({ columnWidths: nextColumnWidths }),
    [setExtractionResultState],
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      if (!event.data?.id || event.data.resultRowType === ExecutionResultRowType.Group) return;
      cellClickHandledRef.current = true;
      const colId = event.column?.getColId() ?? event.colDef?.colId ?? event.colDef?.field ?? null;
      const mappedFieldKey = mapGridColToPivotField(colId);
      openDetail(event.data.id, { focusFieldKey: mappedFieldKey });
    },
    [openDetail],
  );

  const onRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (!event.data?.id || event.data.resultRowType === ExecutionResultRowType.Group) return;
      if (cellClickHandledRef.current) {
        cellClickHandledRef.current = false;
        return;
      }
      openDetail(event.data.id);
    },
    [openDetail],
  );

  const selectedResultIdRef = useRef(detailMode.selectedResultId);
  selectedResultIdRef.current = detailMode.selectedResultId;

  const rowClassRules = useMemo<RowClassRules>(
    () => ({
      'ag-active-detail-row': (params) => params.data?.id === selectedResultIdRef.current,
    }),
    [],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  useEffect(() => {
    gridApiRef.current?.redrawRows();
  }, [detailMode.selectedResultId]);

  useEffect(() => {
    if (!isGroupingEnabled) return;
    gridApiRef.current?.setFilterModel(null);
    gridApiRef.current?.applyColumnState({ defaultState: { sort: null } });
  }, [isGroupingEnabled, colDefs]);

  const gridOptions = useMemo(
    () => ({
      defaultColDef: { filter: false, floatingFilter: false, resizable: true, flex: 1 },
      onRowClicked,
      onCellClicked,
      rowClassRules,
    }),
    [onRowClicked, onCellClicked, rowClassRules],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <Spinner size={40} fullWidth />
        ) : (
          <GridView
            columnDefs={colDefs}
            columnWidths={columnWidths}
            onColumnWidthsChange={onColumnWidthsChange}
            rowData={displayedResults}
            onGridReady={onGridReady}
            additionalGridOptions={gridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
        {showTreePanel && (
          <TreeColumnsPanel
            columns={panelColDefs}
            onColumnsChange={onPanelColumnsChange}
            panelClassName="absolute right-0 top-0 h-full w-72 bg-layer-3 flex flex-col border-l border-primary shadow-lg z-10"
            toggleColumnsPanel={toggleTreePanel}
          />
        )}
      </div>
    </div>
  );
};

export default ExtractionResultTab;
