'use client';

import { IconColumns2 } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { DialGhostButton, DialLoader } from '@epam/ai-dial-ui-kit';

import { getMetricSnapshots, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import AnalyticsBottomDrawer from '@/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { useDrawerPanel } from '@/src/components/Runs/Details/BottomDrawer/useDrawerPanel';
import { ExtractionResultTabUiState } from '@/src/components/Runs/View/models';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
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
  const drawerPanel = useDrawerPanel();

  const gridApiRef = useRef<GridApi | null>(null);
  const isLoading = results === null;

  useEffect(() => {
    if (!run?.id || results !== null) {
      return;
    }

    getTestCaseRunResults(RESULT_FILTERS(run)).then((resultsSettled) => {
      const content = resultsSettled?.content || [];
      setExtractionResultState({
        results: content,
        colDefs: getAnalyticsColumns(content),
        panelColDefs: getAnalyticsColumns(content),
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

  const resultIds = useMemo(() => (results ?? []).map((r) => r.id!).filter(Boolean), [results]);
  useEffect(() => {
    if (resultIds.length > 0) {
      drawerPanel.clearPinIfMissing(resultIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultIds, drawerPanel.clearPinIfMissing]);

  const onRowClicked = useCallback(
    (event: RowClickedEvent) => {
      if (!event.data) return;
      openDetail(event.data.id);
    },
    [openDetail],
  );

  useLayoutEffect(() => {
    if (detailMode.drawerOpen && detailMode.selectedResultId) {
      drawerPanel.open(detailMode.selectedResultId);
    } else if (!detailMode.drawerOpen && drawerPanel.isOpen) {
      drawerPanel.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailMode.drawerOpen, detailMode.selectedResultId]);

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

  const onDrawerClose = useCallback(() => {
    detailMode.closeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailMode.closeDetail]);

  const gridOptions = useMemo(
    () => ({
      defaultColDef: { filter: false, floatingFilter: false },
      onRowClicked,
      rowClassRules,
    }),
    [onRowClicked, rowClassRules],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center justify-end">
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={toggleTreePanel}
        />
      </div>
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
      {detailMode.detailMode === DetailMode.Drawer && detailMode.drawerOpen && (
        <AnalyticsBottomDrawer
          drawerPanel={drawerPanel}
          pendingFocus={detailMode.pendingFocus}
          clearPendingFocus={detailMode.clearPendingFocus}
          onClose={onDrawerClose}
          onSwitchToSidebar={detailMode.switchToSidebar}
          metricBindings={metricBindings}
        />
      )}
      <ColorScale />
    </div>
  );
};

export default ExtractionResultTab;
