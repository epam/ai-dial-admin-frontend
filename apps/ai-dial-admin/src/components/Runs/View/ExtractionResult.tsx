'use client';

import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  NewColumnsLoadedEvent,
  RowClassParams,
  RowClassRules,
  RowClickedEvent,
} from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { executeStructuredQuery, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ColumnWidths } from '@/src/components/Grid/models';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
import { FOCUS_RESTORE_WINDOW_MS } from '@/src/components/Runs/constants';
import { ExtractionDisplayRow, isTestCaseGroupRow } from '@/src/components/Runs/models';
import { buildTestCaseGroupRows } from '@/src/components/Runs/utils/test-case-groups';
import {
  attachTestCaseScores,
  buildTestCaseScoreLookup,
  buildTestCaseScoresQuery,
  parseTestCaseScores,
} from '@/src/components/Runs/utils/test-case-scores';
import { mapGridColToPivotField } from '@/src/components/Runs/View/RowDetails/map-grid-col-to-pivot-field';
import { ExtractionResultTabUiState } from '@/src/components/Runs/View/models';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { hasVaryingExecutionIndices } from '@/src/utils/evaluation/column-variation';
import { getGroupedColumnDefs } from './grouped-columns';
import { useDetailMode } from './use-detail-mode';
import { getAnalyticsColumns, getMetricGroupOrder, getRowDetailFieldSchema, RESULT_FILTERS } from './utils';

const GROUP_ROW_CLASS = 'ag-test-case-group-row';

const getRowClass = (params: RowClassParams): string | undefined =>
  isTestCaseGroupRow(params.data) ? GROUP_ROW_CLASS : undefined;

/**
 * The grid takes its columns a render after its rows. For that render the rows are evaluated against the
 * previous mode's definitions, and a cell the grid has already computed is not recomputed when the
 * definitions then swap, so a group row would keep the flat list's dashes.
 */
const onNewColumnsLoaded = (event: NewColumnsLoadedEvent): void => event.api.redrawRows();

interface Props {
  run: Run;
  extractionResultState: ExtractionResultTabUiState;
  setExtractionResultState: (patch: Partial<ExtractionResultTabUiState>) => void;
}

const ExtractionResultTab: FC<Props> = ({ run, extractionResultState, setExtractionResultState }) => {
  const t = useI18n();
  const {
    isGroupedByTestCase,
    collapsedGroupKeys,
    showTreePanel,
    colDefs,
    panelColDefs,
    columnWidths,
    results,
    testCaseScores,
  } = extractionResultState;
  const canGroup = useMemo(() => hasVaryingExecutionIndices(results ?? []), [results]);
  const isGrouped = isGroupedByTestCase && canGroup;
  const metricGroupOrder = useMemo(() => getMetricGroupOrder(colDefs ?? []), [colDefs]);
  const fieldSchema = useMemo(() => getRowDetailFieldSchema(results ?? []), [results]);
  const rowData = useMemo(
    () =>
      results && testCaseScores
        ? attachTestCaseScores(results, buildTestCaseScoreLookup(testCaseScores), run.id ?? '')
        : null,
    [results, testCaseScores, run.id],
  );
  const displayedRows = useMemo<ExtractionDisplayRow[] | null>(
    () => (rowData && isGrouped ? buildTestCaseGroupRows(rowData, new Set(collapsedGroupKeys)) : rowData),
    [rowData, isGrouped, collapsedGroupKeys],
  );
  const collapsedGroupKeysRef = useRef(collapsedGroupKeys);
  collapsedGroupKeysRef.current = collapsedGroupKeys;
  const focusGroupKeyRef = useRef<string | null>(null);
  const focusExpiryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onToggleGroup = useCallback(
    (groupKey: string) => {
      const current = collapsedGroupKeysRef.current;
      focusGroupKeyRef.current = groupKey;
      // The rebuilt rows mount at a time the grid decides, so the request lives for a fixed window rather
      // than until a frame passes. A request nobody picked up must not steal focus later, when a
      // scrolled-out group's row mounts again.
      clearTimeout(focusExpiryTimerRef.current);
      focusExpiryTimerRef.current = setTimeout(() => {
        focusGroupKeyRef.current = null;
      }, FOCUS_RESTORE_WINDOW_MS);
      setExtractionResultState({
        collapsedGroupKeys: current.includes(groupKey)
          ? current.filter((key) => key !== groupKey)
          : [...current, groupKey],
      });
    },
    [setExtractionResultState],
  );
  useEffect(() => () => clearTimeout(focusExpiryTimerRef.current), []);
  const consumeFocusRequest = useCallback((groupKey: string) => {
    if (focusGroupKeyRef.current !== groupKey) return false;
    focusGroupKeyRef.current = null;
    return true;
  }, []);
  const groupedColumnsOptions = useMemo(
    () => ({ onToggleGroup, consumeFocusRequest }),
    [onToggleGroup, consumeFocusRequest],
  );
  const toDisplayColDefs = useCallback(
    (storedColDefs: ColDef[]) =>
      isGrouped ? getGroupedColumnDefs(storedColDefs, groupedColumnsOptions) : storedColDefs,
    [isGrouped, groupedColumnsOptions],
  );
  const displayedColDefs = useMemo(() => toDisplayColDefs(colDefs), [toDisplayColDefs, colDefs]);
  const testCaseScoreByResultId = useMemo(
    () => new Map((rowData ?? []).flatMap((row) => (row.id ? [[row.id, row.testCaseScore] as const] : []))),
    [rowData],
  );
  const detailMode = useDetailMode(
    metricGroupOrder,
    fieldSchema,
    testCaseScoreByResultId,
    run.suiteSnapshot?.overallScoreThreshold,
  );
  const { openDetail } = detailMode;

  const gridApiRef = useRef<GridApi | null>(null);
  const isLoading = results === null || testCaseScores === null;
  /** Suppress row-click toggle when a cell click already opened/focused detail. */
  const cellClickHandledRef = useRef(false);

  useEffect(() => {
    if (!run?.id || results !== null) {
      return;
    }

    getTestCaseRunResults(RESULT_FILTERS(run)).then((resultsSettled) => {
      const content = resultsSettled?.content || [];
      const nextColDefs = getAnalyticsColumns(content, { threshold: run.suiteSnapshot?.overallScoreThreshold });
      setExtractionResultState({
        results: content,
        colDefs: nextColDefs,
        panelColDefs: nextColDefs,
      });
    });
  }, [run, results, setExtractionResultState]);

  useEffect(() => {
    if (!run?.id || testCaseScores !== null) {
      return;
    }

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
  }, [run?.id, testCaseScores, setExtractionResultState]);

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
      gridApiRef.current?.setGridOption('columnDefs', toDisplayColDefs(newColDefs));
      requestAnimationFrame(() => gridApiRef.current?.sizeColumnsToFit());
    },
    [setExtractionResultState, toDisplayColDefs],
  );

  const onColumnWidthsChange = useCallback(
    (nextColumnWidths: ColumnWidths) => setExtractionResultState({ columnWidths: nextColumnWidths }),
    [setExtractionResultState],
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      if (!event.data?.id || isTestCaseGroupRow(event.data)) return;
      cellClickHandledRef.current = true;
      const colId = event.column?.getColId() ?? event.colDef?.colId ?? event.colDef?.field ?? null;
      const mappedFieldKey = mapGridColToPivotField(colId);
      openDetail(event.data.id, { focusFieldKey: mappedFieldKey });
    },
    [openDetail],
  );

  const onRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (!event.data?.id || isTestCaseGroupRow(event.data)) return;
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

  const isFirstGroupingRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstGroupingRenderRef.current) {
      isFirstGroupingRenderRef.current = false;
      return;
    }
    // A sort or filter set in one mode is invisible in the other, yet would still reorder groups or drop rows.
    gridApiRef.current?.setFilterModel(null);
    gridApiRef.current?.applyColumnState({ defaultState: { sort: null } });
  }, [isGrouped]);

  const gridOptions = useMemo(
    () => ({
      defaultColDef: { filter: false, floatingFilter: false, resizable: true, flex: 1 },
      onRowClicked,
      onCellClicked,
      rowClassRules,
      getRowClass,
      onNewColumnsLoaded,
    }),
    [onRowClicked, onCellClicked, rowClassRules],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <Spinner size={40} fullWidth />
        ) : (
          <GridView<ExtractionDisplayRow>
            columnDefs={displayedColDefs}
            columnWidths={columnWidths}
            onColumnWidthsChange={onColumnWidthsChange}
            rowData={displayedRows}
            onGridReady={onGridReady}
            additionalGridOptions={gridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
        {showTreePanel && (
          <TreeColumnsPanel
            columns={panelColDefs}
            onColumnsChange={onPanelColumnsChange}
            panelClassName="absolute right-0 top-0 h-full w-72 bg-layer-3 flex flex-col border-l border-tertiary shadow-lg z-10"
            toggleColumnsPanel={toggleTreePanel}
          />
        )}
      </div>
    </div>
  );
};

export default ExtractionResultTab;
