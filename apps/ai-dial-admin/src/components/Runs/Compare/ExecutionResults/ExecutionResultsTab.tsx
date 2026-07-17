'use client';

import { ColDef, FilterChangedEvent, GridApi, GridReadyEvent, RowClassRules } from 'ag-grid-community';
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
  collectHiddenColIds,
  flattenComparePanelColumnTree,
  preserveFlatColDefHideState,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';
import {
  countCompareDiffs,
  hasCompareRowDiff,
  isCompareSecondarySideEmpty,
  mergeCompareMetricValuesSchema,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import {
  applyEyeCellRendererParams,
  getCompareColumnsCompare,
  mergeComparePanelColumns,
  splitComparePanelColumns,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { ExecutionResultsTabUiState } from '@/src/components/Runs/Compare/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { getCompareRowSelectionId, mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
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
  executionResultsState: ExecutionResultsTabUiState;
  setExecutionResultsState: (patch: Partial<ExecutionResultsTabUiState>) => void;
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
  executionResultsState,
  setExecutionResultsState,
}) => {
  const t = useI18n();

  const gridApiRef = useRef<GridApi | null>(null);
  const [isGridReady, setIsGridReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  const {
    viewDifferencesOnly,
    hideHighlights,
    gridColDefs,
    panelColDefs,
    filterModel,
    columnState,
    results,
    comparedResults,
  } = executionResultsState;

  const panelColDefsRef = useRef(panelColDefs);
  panelColDefsRef.current = panelColDefs;
  const gridColDefsRef = useRef(gridColDefs);
  gridColDefsRef.current = gridColDefs;

  const errorText = t(RunsI18nKey.MetricFailedText);
  const runNames = useMemo(
    () => ({ primary: primaryRunName, secondary: comparedRunName }),
    [primaryRunName, comparedRunName],
  );

  useEffect(() => {
    if (results !== null) {
      return;
    }

    let isCancelled = false;
    setHasLoadError(false);

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

    getRun(comparedRunId)
      .then((comparedRun) => {
        if (isCancelled || !comparedRun) return;
        return getTestCaseRunResults(RESULT_FILTERS(comparedRun));
      })
      .then((res) => {
        if (isCancelled || res === undefined) return;
        setExecutionResultsState({ comparedResults: res?.content || [] });
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
      selectedRowId: selectedRow ? getCompareRowSelectionId(selectedRow) : null,
      viewRowDetailsLabel: t(RunsI18nKey.RunCompareViewRowDetails),
    }),
    [onOpenRowDetail, selectedRow, t],
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
    setExecutionResultsState({
      panelColDefs: buildComparePanelColumnTree(flatDefs, runNames, panelColDefsRef.current),
      gridColDefs: preserveFlatColDefHideState(flatDefs, gridColDefsRef.current),
    });
  }, [computedColDefs, runNames, setExecutionResultsState]);

  const hiddenColIds = useMemo(() => collectHiddenColIds(gridColDefs), [gridColDefs]);

  const displayedRowData = useMemo(() => {
    if (mergedRowData === null) return null;
    if (!viewDifferencesOnly) return mergedRowData;

    const visibility = { hiddenColIds };
    return mergedRowData.filter((row) => hasCompareRowDiff(row, visibility));
  }, [mergedRowData, viewDifferencesOnly, hiddenColIds]);

  const diffCounts = useMemo(() => countCompareDiffs(mergedRowData ?? []), [mergedRowData]);

  const rowClassRules = useMemo<RowClassRules<CompareAnalyticsRow>>(
    () => ({
      ...(hideHighlights
        ? {}
        : {
            'compare-row-empty compare-row-empty-border': (params) => {
              const row = params.data;
              if (!row) return false;
              return isCompareSecondarySideEmpty(row, metricsSchema);
            },
          }),
      'ag-active-detail-row': (params) => {
        if (!params.data || !selectedRow) return false;
        return getCompareRowSelectionId(params.data) === getCompareRowSelectionId(selectedRow);
      },
    }),
    [hideHighlights, metricsSchema, selectedRow],
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

  const gridOptions = useMemo(
    () => ({
      ...compareGridOptions,
      rowHeight: 40,
      rowClassRules,
      onFilterChanged: (event: FilterChangedEvent) => {
        syncGridUiState(event.api);
      },
      onSortChanged: (event: { api: GridApi }) => {
        syncGridUiState(event.api);
      },
      onColumnMoved: (event: { api: GridApi; finished?: boolean }) => {
        if (event.finished !== false) {
          syncGridUiState(event.api);
        }
      },
      onColumnVisible: (event: { api: GridApi }) => {
        syncGridUiState(event.api);
      },
    }),
    [rowClassRules, syncGridUiState],
  );

  useEffect(() => {
    if (!showDisplayPanel || !computedColDefs?.length) {
      return;
    }

    const gridColumnState = gridApiRef.current?.getColumnState();
    if (!gridColumnState?.length) {
      return;
    }

    const prevPanelColDefs = panelColDefsRef.current;
    if (!prevPanelColDefs.length) {
      return;
    }

    const syncedColDefs = applyColumnStateOrderToTreeColDefs(prevPanelColDefs, gridColumnState);
    if (haveTreeColDefsSamePanelState(prevPanelColDefs, syncedColDefs)) {
      return;
    }

    setExecutionResultsState({ panelColDefs: syncedColDefs });
  }, [showDisplayPanel, computedColDefs, setExecutionResultsState]);

  const onPanelColumnsChange = useCallback(
    (nestedPanelCols: ColDef[]) => {
      const flatDefs = flattenComparePanelColumnTree(nestedPanelCols);
      const { actionColumn } = splitComparePanelColumns(computedColDefs as ColDef[]);
      const mergedGridDefs = mergeComparePanelColumns(flatDefs, actionColumn);

      setExecutionResultsState({
        panelColDefs: nestedPanelCols,
        gridColDefs: mergedGridDefs,
      });
      requestAnimationFrame(() => gridApiRef.current?.sizeColumnsToFit());
    },
    [computedColDefs, setExecutionResultsState],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => {
    gridApiRef.current = event.api;
    setIsGridReady(true);
  }, []);

  // Restore after AgGridWrapper's setGridColumnsState (child effect runs first).
  useEffect(() => {
    const api = gridApiRef.current;
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

    if (columnState?.length) {
      api.applyColumnState({ state: columnState, applyOrder: true });
    }
  }, [isGridReady, filterModel, columnState, displayColDefs, displayedRowData]);

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
