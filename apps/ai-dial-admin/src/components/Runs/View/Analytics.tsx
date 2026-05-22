'use client';

import { IconColumns2, IconX } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  DialGhostButton,
  DialGhostIconButton,
  DialLoader,
  DialSelect,
  ElementSize,
  SelectOption,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';

import { getRuns, getMetricSnapshots, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import AnalyticsBottomDrawer from '@/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { useDrawerPanel } from '@/src/components/Runs/Details/BottomDrawer/useDrawerPanel';
import { ButtonsI18nKey, EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { MetricSnapshot } from '@/src/models/evaluation/metric';
import { AnalyticsResult, Run, RunStatus } from '@/src/models/evaluation/run';
import { FilterOperatorDto } from '@/src/types/request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { CompareAnalyticsRow } from './models';

import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
import { useDetailMode } from './use-detail-mode';
import {
  getAnalyticsColumns,
  getAnalyticsColumnsCompare,
  mergeByTestCaseId,
  RESULT_FILTERS,
  RUN_FILTER,
  snapshotsToBindingsMap,
} from './utils';

interface Props {
  run: Run;
}

const AnalyticsTab: FC<Props> = ({ run }) => {
  const t = useI18n();
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [comparedSnapshots, setComparedSnapshots] = useState<MetricSnapshot[]>([]);
  const metricBindings = useMemo(() => snapshotsToBindingsMap(snapshots), [snapshots]);
  const comparedMetricBindings = useMemo(() => snapshotsToBindingsMap(comparedSnapshots), [comparedSnapshots]);
  const detailMode = useDetailMode(metricBindings);
  const drawerPanel = useDrawerPanel();

  const gridApiRef = useRef<GridApi | null>(null);
  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [colDefs, setColDefs] = useState<ColDef[]>(() => getAnalyticsColumns([]));
  const [isLoading, setIsLoading] = useState(false);

  const [siblingRuns, setSiblingRuns] = useState<Run[]>([]);
  const [comparedRunId, setComparedRunId] = useState<string | null>(null);
  const [comparedResults, setComparedResults] = useState<AnalyticsResult[] | null>(null);
  const [isCompareLoading, setIsCompareLoading] = useState(false);

  useEffect(() => {
    if (!run?.id) return;

    if (!isLoading && !results) {
      setIsLoading(true);
      getTestCaseRunResults(RESULT_FILTERS(run))
        .then((resultsSettled) => {
          const content = resultsSettled?.content || [];
          setResults(content);
          setColDefs(getAnalyticsColumns(content, t(RunsI18nKey.MetricFailedText)));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLoading, results, run, t]);

  useEffect(() => {
    if (!run?.id) return;

    getMetricSnapshots(RUN_FILTER(run.id)).then((data) => {
      setSnapshots(data || []);
    });
  }, [run.id]);

  useEffect(() => {
    if (!run?.testSuiteId) return;

    getRuns(
      0,
      100,
      [],
      [
        { column: 'testSuiteId', operator: FilterOperatorDto.EQUALS, value: run.testSuiteId },
        { column: 'status', operator: FilterOperatorDto.EQUALS, value: RunStatus.COMPLETED },
      ],
    ).then((res) => {
      const runs = (res?.content || []) as Run[];
      setSiblingRuns(runs.filter((r) => r.id !== run.id));
    });
  }, [run.id, run.testSuiteId]);

  useEffect(() => {
    if (!comparedRunId) {
      setComparedResults(null);
      setComparedSnapshots([]);
      return;
    }
    const comparedRun = siblingRuns.find((r) => r.id === comparedRunId);
    if (!comparedRun) return;

    setIsCompareLoading(true);
    Promise.all([getTestCaseRunResults(RESULT_FILTERS(comparedRun)), getMetricSnapshots(RUN_FILTER(comparedRunId))])
      .then(([res, snapData]) => {
        setComparedResults(res?.content || []);
        setComparedSnapshots(snapData || []);
      })
      .finally(() => {
        setIsCompareLoading(false);
      });
  }, [comparedRunId, siblingRuns]);

  const [showTreePanel, setShowTreePanel] = useState(false);
  const [panelColDefs, setPanelColDefs] = useState<ColDef[]>(() => getAnalyticsColumns([]));

  const isCompareMode = comparedRunId !== null && comparedResults !== null;
  const errorText = t(RunsI18nKey.MetricFailedText);

  const rowData = useMemo(() => {
    if (!results) return null;
    if (isCompareMode) return mergeByTestCaseId(results, comparedResults!);
    return results;
  }, [results, isCompareMode, comparedResults]);

  const computedColDefs = useMemo(() => {
    if (!results) return colDefs;
    if (isCompareMode) return getAnalyticsColumnsCompare(mergeByTestCaseId(results, comparedResults!), errorText);
    return colDefs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompareMode, results, comparedResults, errorText]);

  useEffect(() => {
    setPanelColDefs(computedColDefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedColDefs]);

  const toggleTreePanel = useCallback(() => setShowTreePanel((prev) => !prev), []);

  useEffect(() => {
    if (!showTreePanel || !computedColDefs?.length) {
      return;
    }

    const columnState = gridApiRef.current?.getColumnState();
    if (!columnState?.length) {
      return;
    }

    setPanelColDefs((prevColDefs) => {
      if (!prevColDefs?.length) {
        return prevColDefs;
      }

      const syncedColDefs = applyColumnStateOrderToTreeColDefs(prevColDefs, columnState);
      if (haveTreeColDefsSamePanelState(prevColDefs, syncedColDefs)) {
        return prevColDefs;
      }

      return syncedColDefs;
    });
  }, [showTreePanel, computedColDefs]);

  const onPanelColumnsChange = useCallback((newColDefs: ColDef[]) => {
    setPanelColDefs(newColDefs);
    gridApiRef.current?.setGridOption('columnDefs', newColDefs);
  }, []);

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
      if (isCompareMode) {
        const comparedResultId = (event.data as CompareAnalyticsRow)._compared?.id ?? null;
        detailMode.setSelectedForCompare(event.data.id);
        drawerPanel.openRunCompare(event.data.id, comparedResultId);
      } else {
        detailMode.openDetail(event.data.id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCompareMode, detailMode.setSelectedForCompare, detailMode.openDetail, drawerPanel.openRunCompare],
  );

  useLayoutEffect(() => {
    if (drawerPanel.isRunCompareMode) return;
    if (detailMode.drawerOpen && detailMode.selectedResultId) {
      drawerPanel.open(detailMode.selectedResultId);
    } else if (!detailMode.drawerOpen && drawerPanel.isOpen) {
      drawerPanel.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailMode.drawerOpen, detailMode.selectedResultId, drawerPanel.isRunCompareMode]);

  useEffect(() => {
    if (!isCompareMode && drawerPanel.isRunCompareMode) {
      drawerPanel.close();
      detailMode.clearSelected();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompareMode]);

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

  const siblingRunOptions = useMemo<SelectOption[]>(
    () =>
      siblingRuns.map((r) => ({
        value: r.id!,
        label: `${r.testRunName || r.id}${r.startedAt ? ` · ${formatDateTimeToLocalString(r.startedAt)}` : ''}`,
      })),
    [siblingRuns],
  );

  const runCompareNames = useMemo(() => {
    if (!isCompareMode) return undefined;
    const currentName = `${run.testRunName || run.id}${run.startedAt ? ` · ${formatDateTimeToLocalString(run.startedAt)}` : ''}`;
    const comparedRun = siblingRuns.find((r) => r.id === comparedRunId);
    const comparedName = comparedRun
      ? `${comparedRun.testRunName || comparedRun.id}${comparedRun.startedAt ? ` · ${formatDateTimeToLocalString(comparedRun.startedAt)}` : ''}`
      : '';
    return { current: currentName, compared: comparedName };
  }, [isCompareMode, run, comparedRunId, siblingRuns]);

  const onDrawerClose = useCallback(() => {
    if (drawerPanel.isRunCompareMode) {
      drawerPanel.close();
      detailMode.clearSelected();
    } else {
      detailMode.closeDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerPanel.isRunCompareMode, drawerPanel.close, detailMode.closeDetail, detailMode.clearSelected]);

  const onCompareChange = useCallback((value: string | string[]) => {
    setComparedRunId(value as string);
  }, []);

  const onCompareClear = useCallback(() => {
    setComparedRunId(null);
  }, []);

  const compareGridOptions = useMemo(
    () => ({
      defaultColDef: { filter: false, floatingFilter: false },
      onRowClicked,
      rowClassRules,
      ...(isCompareMode ? { groupHeaderHeight: 28 } : {}),
    }),
    [isCompareMode, onRowClicked, rowClassRules],
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">{t(RunsI18nKey.CompareWith)}</span>
          <DialSelect
            key={comparedRunId ?? 'none'}
            size={SelectSize.Sm}
            variant={SelectVariant.Secondary}
            options={siblingRunOptions}
            value={comparedRunId ?? undefined}
            placeholder={t(EntitiesI18nKey.NoRuns)}
            disabled={siblingRunOptions.length === 0}
            onChange={onCompareChange}
          />
          {comparedRunId &&
            (isCompareLoading ? (
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                <DialLoader size={20} />
              </div>
            ) : (
              <DialGhostIconButton size={ElementSize.Small} icon={<IconX size={12} />} onClick={onCompareClear} />
            ))}
        </div>
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
            key={isCompareMode ? 'compare' : 'normal'}
            columnDefs={computedColDefs}
            rowData={rowData}
            onGridReady={onGridReady}
            additionalGridOptions={compareGridOptions}
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
      {((detailMode.detailMode === DetailMode.Drawer && detailMode.drawerOpen) || drawerPanel.isRunCompareMode) && (
        <AnalyticsBottomDrawer
          drawerPanel={drawerPanel}
          pendingFocus={detailMode.pendingFocus}
          clearPendingFocus={detailMode.clearPendingFocus}
          onClose={onDrawerClose}
          onSwitchToSidebar={detailMode.switchToSidebar}
          runCompareNames={runCompareNames}
          metricBindings={metricBindings}
          comparedMetricBindings={isCompareMode ? comparedMetricBindings : undefined}
        />
      )}
      <ColorScale />
    </div>
  );
};

export default AnalyticsTab;
