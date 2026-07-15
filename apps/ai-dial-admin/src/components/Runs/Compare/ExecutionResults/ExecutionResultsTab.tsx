'use client';

import { ColDef, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import { applyColumnStateOrderToTreeColDefs, haveTreeColDefsSamePanelState } from '@/src/components/Grid/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import DisplayPanel from '@/src/components/Runs/Compare/ExecutionResults/DisplayPanel';
import DiffLegend from '@/src/components/Runs/Compare/ExecutionResults/DiffLegend';
import { compareGridOptions } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import {
  buildComparePanelColumnTree,
  flattenComparePanelColumnTree,
  preserveFlatColDefHideState,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';
import {
  countCompareDiffs,
  hasCompareRowDiff,
  isCompareRowFullyEmpty,
  mergeCompareMetricValuesSchema,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import {
  applyEyeCellRendererParams,
  getCompareColumnsCompare,
  mergeComparePanelColumns,
  splitComparePanelColumns,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  showDisplayPanel: boolean;
  onToggleDisplayPanel: () => void;
  selectedRow: CompareAnalyticsRow | null;
  onOpenRowDetail: (row: CompareAnalyticsRow) => void;
}

const DISPLAY_PANEL_CLASS_NAME =
  'flex flex-col absolute right-0 top-0 bottom-0 w-[397px] bg-layer-3 border-l border-primary shadow-lg z-20';

const ExecutionResultsTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  showDisplayPanel,
  onToggleDisplayPanel,
  selectedRow,
  onOpenRowDetail,
}) => {
  const t = useI18n();

  const gridApiRef = useRef<GridApi | null>(null);

  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [comparedResults, setComparedResults] = useState<AnalyticsResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const [viewDifferencesOnly, setViewDifferencesOnly] = useState(false);
  const [hideHighlights, setHideHighlights] = useState(false);
  const [gridColDefs, setGridColDefs] = useState<ColDef[]>([]);
  const [panelColDefs, setPanelColDefs] = useState<ColDef[]>([]);

  const errorText = t(RunsI18nKey.MetricFailedText);
  const runNames = useMemo(
    () => ({ primary: primaryRunName, secondary: comparedRunName }),
    [primaryRunName, comparedRunName],
  );

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setHasLoadError(false);
    setResults(null);

    getRun(primaryRunId)
      .then((runData) => {
        if (isCancelled) return;
        if (!runData) {
          setHasLoadError(true);
          return;
        }
        return getTestCaseRunResults(RESULT_FILTERS(runData));
      })
      .then((resultsResponse) => {
        if (isCancelled || resultsResponse === undefined) return;
        setResults(resultsResponse?.content || []);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [primaryRunId]);

  useEffect(() => {
    let isCancelled = false;

    setIsCompareLoading(true);
    setComparedResults(null);

    getRun(comparedRunId)
      .then((comparedRun) => {
        if (isCancelled || !comparedRun) return;
        return getTestCaseRunResults(RESULT_FILTERS(comparedRun));
      })
      .then((res) => {
        if (isCancelled || res === undefined) return;
        setComparedResults(res?.content || []);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCompareLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [comparedRunId]);

  const mergedRowData = useMemo(() => {
    if (results === null || comparedResults === null) return null;
    return mergeByTestCaseId(results, comparedResults);
  }, [results, comparedResults]);

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
    });
  }, [mergedRowData, errorText, t, hideHighlights, metricsSchema]);

  const eyeRendererParams = useMemo(
    () => ({
      onOpenRowDetail,
      selectedRowId: selectedRow?.id ?? null,
      viewRowDetailsLabel: t(RunsI18nKey.RunCompareViewRowDetails),
    }),
    [onOpenRowDetail, selectedRow?.id, t],
  );

  const displayColDefs = useMemo(() => {
    const base = gridColDefs.length > 0 ? gridColDefs : computedColDefs;
    if (!base.length) return base;
    return applyEyeCellRendererParams(base as ColDef[], eyeRendererParams);
  }, [gridColDefs, computedColDefs, eyeRendererParams]);

  useEffect(() => {
    if (!displayColDefs.length) return;
    gridApiRef.current?.setGridOption('columnDefs', displayColDefs);
  }, [displayColDefs]);

  useEffect(() => {
    if (!computedColDefs.length) {
      return;
    }

    const flatDefs = computedColDefs as ColDef[];
    setPanelColDefs((prev) => buildComparePanelColumnTree(flatDefs, runNames, prev));
    setGridColDefs((prev) => preserveFlatColDefHideState(flatDefs, prev));
  }, [computedColDefs, runNames]);

  const displayedRowData = useMemo(() => {
    if (mergedRowData === null) return null;
    if (!viewDifferencesOnly) return mergedRowData;
    return mergedRowData.filter(hasCompareRowDiff);
  }, [mergedRowData, viewDifferencesOnly]);

  const diffCounts = useMemo(() => countCompareDiffs(mergedRowData ?? []), [mergedRowData]);

  const rowClassRules = useMemo<RowClassRules<CompareAnalyticsRow>>(
    () => ({
      ...(hideHighlights
        ? {}
        : {
            'compare-row-empty compare-row-empty-border': (params) => {
              const row = params.data;
              if (!row) return false;
              return isCompareRowFullyEmpty(row, metricsSchema);
            },
          }),
      'ag-active-detail-row': (params) => params.data?.id === selectedRow?.id,
    }),
    [hideHighlights, metricsSchema, selectedRow?.id],
  );

  const gridOptions = useMemo(
    () => ({
      ...compareGridOptions,
      rowHeight: 40,
      rowClassRules,
    }),
    [rowClassRules],
  );

  useEffect(() => {
    if (!showDisplayPanel || !computedColDefs?.length) {
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
  }, [showDisplayPanel, computedColDefs]);

  const onPanelColumnsChange = useCallback(
    (nestedPanelCols: ColDef[]) => {
      const flatDefs = flattenComparePanelColumnTree(nestedPanelCols);
      const { actionColumn } = splitComparePanelColumns(computedColDefs as ColDef[]);
      const mergedGridDefs = mergeComparePanelColumns(flatDefs, actionColumn);

      setPanelColDefs(nestedPanelCols);
      setGridColDefs(mergedGridDefs);
      requestAnimationFrame(() => gridApiRef.current?.sizeColumnsToFit());
    },
    [computedColDefs],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
  }, []);

  const isCompareDataReady = results !== null && comparedResults !== null;

  if (hasLoadError) {
    return <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>;
  }

  if (isLoading || isCompareLoading || !isCompareDataReady) {
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
              onViewDifferencesOnlyChange={setViewDifferencesOnly}
              hideHighlights={hideHighlights}
              onHideHighlightsChange={setHideHighlights}
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
