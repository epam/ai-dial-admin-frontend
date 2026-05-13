'use client';

import { ColDef, GridApi, GridReadyEvent, RowClassRules, RowClickedEvent } from 'ag-grid-community';
import { IconX } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  DialGhostIconButton,
  DialLoader,
  DialSelect,
  SelectOption,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';

import { getRuns, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import AnalyticsBottomDrawer from '@/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { useDrawerPanel } from '@/src/components/Runs/Details/BottomDrawer/useDrawerPanel';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run, RunStatus } from '@/src/models/evaluation/run';
import { FilterOperatorDto } from '@/src/types/request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

import { useDetailMode } from './use-detail-mode';
import { getAnalyticsColumns, getAnalyticsColumnsCompare, mergeByTestCaseId, RESULT_FILTERS } from './utils';

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
      return;
    }
    const comparedRun = siblingRuns.find((r) => r.id === comparedRunId);
    if (!comparedRun) return;

    setIsCompareLoading(true);
    getTestCaseRunResults(RESULT_FILTERS(comparedRun))
      .then((res) => {
        setComparedResults(res?.content || []);
      })
      .finally(() => {
        setIsCompareLoading(false);
      });
  }, [comparedRunId, siblingRuns]);

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

  const siblingRunOptions = useMemo<SelectOption[]>(
    () =>
      siblingRuns.map((r) => ({
        value: r.id!,
        label: `${r.testRunName || r.id}${r.startedAt ? ` · ${formatDateTimeToLocalString(r.startedAt)}` : ''}`,
      })),
    [siblingRuns],
  );

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
        {isCompareLoading && <DialLoader size={20} />}
        {comparedRunId && <DialGhostIconButton icon={<IconX size={14} />} onClick={onCompareClear} />}
      </div>
      <div className="flex-1 min-h-0">
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
