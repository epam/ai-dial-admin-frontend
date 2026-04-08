'use client';

import { ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import AnalyticsBottomDrawer from '@/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { useDrawerPanel } from '@/src/components/Runs/Details/BottomDrawer/useDrawerPanel';
import { EntitiesI18nKey, RunsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';

import { useDetailMode } from './use-detail-mode';
import { getAnalyticsColumns, RESULT_FILTERS } from './utils';

interface Props {
  run: Run;
}

const AnalyticsTab: FC<Props> = ({ run }) => {
  const t = useI18n();
  const detailMode = useDetailMode();
  const drawerPanel = useDrawerPanel();

  const gridApiRef = useRef<GridApi | null>(null);
  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [colDefs, setColDefs] = useState<ColDef[]>(() => getAnalyticsColumns([]));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!run?.id) return;

    if (!isLoading && !results) {
      setIsLoading(true);
      getTestCaseRunResults(RESULT_FILTERS(run)).then((res) => {
        const content = res?.content || [];
        setResults(content);
        setColDefs(getAnalyticsColumns(content, t(RunsI18nKey.MetricFailedText)));
        setIsLoading(false);
      });
    }
  }, [isLoading, results, run, t]);

  // Clear pinned if missing from results
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
      detailMode.openDetail(event.data.id);
    },
    [detailMode],
  );

  // Sync drawer open/close with detailMode — useLayoutEffect ensures activeId is set
  // before the drawer's useEffect (fetch) fires on mount.
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

  // Redraw rows when selected result changes so rowClassRules re-evaluate
  useEffect(() => {
    gridApiRef.current?.redrawRows();
  }, [detailMode.selectedResultId]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <h2>{t(TabsI18nKey.Analytics)}</h2>
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <DialLoader size={40} />
        ) : (
          <GridView
            columnDefs={colDefs}
            rowData={results}
            onGridReady={onGridReady}
            additionalGridOptions={{
              defaultColDef: { filter: false, floatingFilter: false },
              onRowClicked,
              rowClassRules,
            }}
            emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          />
        )}
      </div>
      {detailMode.detailMode === DetailMode.Drawer && detailMode.drawerOpen && (
        <AnalyticsBottomDrawer
          drawerPanel={drawerPanel}
          pendingFocus={detailMode.pendingFocus}
          clearPendingFocus={detailMode.clearPendingFocus}
          onClose={detailMode.closeDetail}
          onSwitchToSidebar={detailMode.switchToSidebar}
        />
      )}
      <ColorScale />
    </div>
  );
};

export default AnalyticsTab;
