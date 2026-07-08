'use client';

import { FirstDataRenderedEvent, GridApi, RowHeightParams } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale, { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import { HEAT_MAP_HEADER_HEIGHT, HEAT_MAP_ROW_HEIGHT } from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapColumns } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-columns';
import {
  getHeatMapValueColumnWidth,
  resolveHeatMapHeaderHeight,
  resolveHeatMapRowHeight,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';
import {
  buildHeatMapRowsForMode,
  filterHeatMapRowsByExpandedGroups,
  getHeatMapGroupKeys,
} from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import { mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  colorDisplayMode: HeatMapColorDisplayMode;
  onColorDisplayModeChange: (mode: HeatMapColorDisplayMode) => void;
}

const HeatMapTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  colorDisplayMode,
  onColorDisplayModeChange: _onColorDisplayModeChange,
}) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(true);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [results, setResults] = useState<AnalyticsResult[] | null>(null);
  const [comparedResults, setComparedResults] = useState<AnalyticsResult[] | null>(null);

  const errorText = t(RunsI18nKey.MetricFailedText);

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

  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;

  const allHeatMapRows = useMemo(() => {
    if (mergedRowData === null) return [];
    return buildHeatMapRowsForMode(mergedRowData, colorDisplayMode);
  }, [mergedRowData, colorDisplayMode]);

  useEffect(() => {
    if (!allHeatMapRows.length) {
      return;
    }
    setExpandedGroups(new Set(getHeatMapGroupKeys(allHeatMapRows)));
  }, [allHeatMapRows]);

  const onToggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const visibleRows = useMemo(
    () => filterHeatMapRowsByExpandedGroups(allHeatMapRows, expandedGroups),
    [allHeatMapRows, expandedGroups],
  );

  const columnDefs = useMemo(() => {
    if (mergedRowData === null) return [];
    return buildHeatMapColumns(mergedRowData, {
      colorDisplayMode,
      errorText,
      expandedGroups,
      onToggleGroup,
      primaryRunName,
      comparedRunName,
    });
  }, [mergedRowData, colorDisplayMode, errorText, expandedGroups, onToggleGroup, primaryRunName, comparedRunName]);

  const fitHeatMapColumns = useCallback((api: GridApi) => {
    api.sizeColumnsToFit();
    const valueColumnWidth = getHeatMapValueColumnWidth(api);
    const headerHeight = resolveHeatMapHeaderHeight(valueColumnWidth);
    api.setGridOption('headerHeight', headerHeight);
    api.resetRowHeights();
    api.refreshHeader();
    api.refreshCells({ force: true });
  }, []);

  const gridOptions = useMemo(
    () => ({
      headerHeight: HEAT_MAP_HEADER_HEIGHT,
      hidePaddedHeaderRows: false,
      rowHeight: HEAT_MAP_ROW_HEIGHT,
      suppressHorizontalScroll: true,
      autoSizeStrategy: undefined,
      getRowHeight: (params: RowHeightParams<HeatMapRow>) => {
        const valueColumnWidth = params.api ? getHeatMapValueColumnWidth(params.api) : 0;
        return resolveHeatMapRowHeight(valueColumnWidth, isDeltaMode);
      },
      defaultColDef: {
        filter: false,
        floatingFilter: false,
        resizable: false,
        sortable: false,
      },
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        fitHeatMapColumns(event.api);
      },
      onGridSizeChanged: (event: { api: GridApi }) => {
        fitHeatMapColumns(event.api);
      },
      onColumnResized: (event: { api: GridApi; finished: boolean | undefined }) => {
        if (event.finished) {
          event.api.resetRowHeights();
          event.api.refreshCells({ force: true });
        }
      },
    }),
    [fitHeatMapColumns, isDeltaMode],
  );

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
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden heat-map-grid">
        <GridView
          key={`${primaryRunId}-${comparedRunId}-${colorDisplayMode}`}
          columnDefs={columnDefs}
          rowData={visibleRows}
          additionalGridOptions={gridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoResults) }}
          getRowId={({ data }) => data.id}
        />
      </div>

      <div className="flex justify-start shrink-0 pb-2">
        <ColorScale variant={isDeltaMode ? ColorScaleVariant.Delta : ColorScaleVariant.Compact} />
      </div>
    </div>
  );
};

export default HeatMapTab;
