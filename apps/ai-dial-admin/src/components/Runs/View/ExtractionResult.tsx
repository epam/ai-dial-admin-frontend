'use client';

import { GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getMetricSnapshots, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import AnalyticsBottomDrawer from '@/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { useDrawerPanel } from '@/src/components/Runs/Details/BottomDrawer/useDrawerPanel';
import { ExtractionResultTabUiState } from '@/src/components/Runs/View/models';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { applyResultsGrouping, toGroupableResultRows } from './results-grouping-columns';
import { useDetailMode } from './use-detail-mode';
import { getAnalyticsColumns, RESULT_FILTERS, RUN_FILTER, snapshotsToBindingsMap } from './utils';

interface Props {
  run: Run;
  extractionResultState: ExtractionResultTabUiState;
  setExtractionResultState: (patch: Partial<ExtractionResultTabUiState>) => void;
}

const ExtractionResultTab: FC<Props> = ({ run, extractionResultState, setExtractionResultState }) => {
  const t = useI18n();
  const { colDefs, results, snapshots } = extractionResultState;
  const metricBindings = useMemo(() => snapshotsToBindingsMap(snapshots), [snapshots]);
  const detailMode = useDetailMode(metricBindings);
  const { openDetail } = detailMode;
  const drawerPanel = useDrawerPanel();

  const gridApiRef = useRef<GridApi | null>(null);
  const isLoading = results === null;

  const rawRows = useMemo(() => toGroupableResultRows(results ?? []), [results]);
  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);
  const projection = useTurnGroupProjection({
    rawRows,
    defaultExpanded: true,
    singlesFirst: true,
    onGridReady,
  });

  const groupedColDefs = useMemo(
    () => applyResultsGrouping(colDefs ?? [], projection.onToggleExpand),
    [colDefs, projection.onToggleExpand],
  );

  useEffect(() => {
    if (!run?.id || results !== null) {
      return;
    }

    getTestCaseRunResults(RESULT_FILTERS(run)).then((resultsSettled) => {
      const content = resultsSettled?.content || [];
      setExtractionResultState({
        results: content,
      });
    });
  }, [run, results, setExtractionResultState]);

  useEffect(() => {
    if (results === null) {
      return;
    }

    setExtractionResultState({
      colDefs: getAnalyticsColumns(results),
    });
  }, [results, setExtractionResultState]);

  useEffect(() => {
    if (!run?.id || snapshots.length > 0) {
      return;
    }

    getMetricSnapshots(RUN_FILTER(run.id)).then((data) => {
      setExtractionResultState({ snapshots: data || [] });
    });
  }, [run?.id, snapshots.length, setExtractionResultState]);

  const resultIds = useMemo(() => (results ?? []).map((r) => r.id!).filter(Boolean), [results]);
  useEffect(() => {
    if (resultIds.length > 0) {
      drawerPanel.clearPinIfMissing(resultIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultIds, drawerPanel.clearPinIfMissing]);

  const onRowClicked = useCallback(
    (event: RowClickedEvent) => {
      const data = event.data as GroupedGridRow | undefined;
      if (!data) return;
      // The synthesized GROUP summary row has no result detail; its chevron owns expand/collapse, so
      // a row-body click is a no-op (toggling here too would double-fire with the chevron).
      if (data.rowType === GridRowType.GROUP) return;
      openDetail(data.id);
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
      // Intentionally NO getRowId: the grid must re-render rows in projection order on every
      // expand/collapse. With getRowId, ag-grid does immutable id-diffing and appends re-expanded
      // turn rows at the bottom instead of under their group. Highlight/detail key off data.id.
      getRowHeight: projection.getRowHeight,
      onFilterChanged: projection.onFilterChanged,
    }),
    [onRowClicked, rowClassRules, projection.getRowHeight, projection.onFilterChanged],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <DialLoader size={40} />
        ) : (
          <GridView
            columnDefs={groupedColDefs}
            rowData={projection.rowData}
            onGridReady={projection.onGridReady}
            additionalGridOptions={gridOptions}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
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
    </div>
  );
};

export default ExtractionResultTab;
