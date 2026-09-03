'use client';

import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getMetricSnapshots, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
import { mapGridColToPivotField } from '@/src/components/Runs/View/RowDetails/map-grid-col-to-pivot-field';
import { ExtractionResultTabUiState } from '@/src/components/Runs/View/models';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { useDetailMode } from './use-detail-mode';
import { getAnalyticsColumns, RESULT_FILTERS, RUN_FILTER, snapshotsToBindingsMap } from './utils';

interface Props {
  run: Run;
  extractionResultState: ExtractionResultTabUiState;
  setExtractionResultState: (patch: Partial<ExtractionResultTabUiState>) => void;
}

const ExtractionResultTab: FC<Props> = ({ run, extractionResultState, setExtractionResultState }) => {
  const t = useI18n();
  const { showTreePanel, colDefs, panelColDefs, results, snapshots } = extractionResultState;
  const metricBindings = useMemo(() => snapshotsToBindingsMap(snapshots), [snapshots]);
  const detailMode = useDetailMode(metricBindings);
  const { openDetail } = detailMode;

  const gridApiRef = useRef<GridApi | null>(null);
  const isLoading = results === null;
  /** Suppress row-click toggle when a cell click already opened/focused detail. */
  const cellClickHandledRef = useRef(false);

  useEffect(() => {
    if (!run?.id || results !== null) {
      return;
    }

    getTestCaseRunResults(RESULT_FILTERS(run)).then((resultsSettled) => {
      const content = resultsSettled?.content || [];
      const nextColDefs = getAnalyticsColumns(content);
      setExtractionResultState({
        results: content,
        colDefs: nextColDefs,
        panelColDefs: nextColDefs,
      });
    });
  }, [run, results, setExtractionResultState]);

  useEffect(() => {
    if (!run?.id || snapshots.length > 0) {
      return;
    }

    getMetricSnapshots(RUN_FILTER(run.id)).then((data) => {
      setExtractionResultState({ snapshots: data || [] });
    });
  }, [run?.id, snapshots.length, setExtractionResultState]);

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

  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      if (!event.data?.id) return;
      cellClickHandledRef.current = true;
      const colId = event.column?.getColId() ?? event.colDef?.colId ?? event.colDef?.field ?? null;
      openDetail(event.data.id, { focusFieldKey: mapGridColToPivotField(colId) });
    },
    [openDetail],
  );

  const onRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (!event.data?.id) return;
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
          <DialLoader size={40} />
        ) : (
          <GridView
            columnDefs={colDefs}
            rowData={results}
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
