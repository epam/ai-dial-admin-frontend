'use client';

import { FirstDataRenderedEvent, GridApi, RowHeightParams } from 'ag-grid-community';
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import ColorScale, { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import GridView from '@/src/components/Grid/GridView/GridView';
import { HEAT_MAP_ROW_HEIGHT } from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapColumns } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-columns';
import {
  buildHeatMapRowsForMode,
  filterHeatMapRowsByExpandedGroups,
  filterHeatMapRowsByMetricGroups,
  getHeatMapGroupKeys,
} from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import { centerHeatMapTooltipPopup } from '@/src/components/Runs/Compare/HeatMap/utils/center-heat-map-tooltip-popup';
import {
  getHeatMapValueColumnWidth,
  resolveHeatMapHeaderHeight,
  resolveHeatMapRowHeight,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';
import { getHeatMapTestCaseHeaderLabels } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { HeatMapTabUiState } from '@/src/components/Runs/Compare/models';
import { mergeByTestCaseId, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  colorDisplayMode: HeatMapColorDisplayMode;
  onColorDisplayModeChange: (mode: HeatMapColorDisplayMode) => void;
  selectedMetricGroups: Set<string>;
  onAvailableMetricGroupsChange: (groups: string[]) => void;
  heatMapState: HeatMapTabUiState;
  setHeatMapState: (patch: Partial<HeatMapTabUiState>) => void;
}

const HeatMapTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  colorDisplayMode,
  onColorDisplayModeChange: _onColorDisplayModeChange,
  selectedMetricGroups,
  onAvailableMetricGroupsChange,
  heatMapState,
  setHeatMapState,
}) => {
  const t = useI18n();

  const [hasLoadError, setHasLoadError] = useState(false);
  const { expandedGroups, areExpandedGroupsInitialized, results, comparedResults } = heatMapState;

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
        setHeatMapState({ results: resultsResponse?.content || [] });
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [primaryRunId, results, setHeatMapState]);

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
        setHeatMapState({ comparedResults: res?.content || [] });
      })
      .catch(() => {
        if (!isCancelled) {
          setHasLoadError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [comparedRunId, comparedResults, setHeatMapState]);

  const mergedRowData = useMemo(() => {
    if (results === null || comparedResults === null) return null;
    return mergeByTestCaseId(results, comparedResults);
  }, [results, comparedResults]);

  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;

  const allHeatMapRows = useMemo(() => {
    if (mergedRowData === null) return [];
    return buildHeatMapRowsForMode(mergedRowData, colorDisplayMode);
  }, [mergedRowData, colorDisplayMode]);

  useLayoutEffect(() => {
    onAvailableMetricGroupsChange(getHeatMapGroupKeys(allHeatMapRows));
  }, [allHeatMapRows, onAvailableMetricGroupsChange]);

  const metricFilteredRows = useMemo(
    () => filterHeatMapRowsByMetricGroups(allHeatMapRows, selectedMetricGroups),
    [allHeatMapRows, selectedMetricGroups],
  );

  useLayoutEffect(() => {
    const groupKeys = getHeatMapGroupKeys(metricFilteredRows);
    if (!groupKeys.length || areExpandedGroupsInitialized) {
      return;
    }
    setHeatMapState({
      expandedGroups: new Set(groupKeys),
      areExpandedGroupsInitialized: true,
    });
  }, [metricFilteredRows, areExpandedGroupsInitialized, setHeatMapState]);

  const onToggleGroup = useCallback(
    (groupKey: string) => {
      const next = new Set(expandedGroups);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      setHeatMapState({ expandedGroups: next });
    },
    [expandedGroups, setHeatMapState],
  );

  const visibleRows = useMemo(
    () => filterHeatMapRowsByExpandedGroups(metricFilteredRows, expandedGroups),
    [metricFilteredRows, expandedGroups],
  );

  const columnDefs = useMemo(() => {
    if (mergedRowData === null) return [];
    return buildHeatMapColumns(mergedRowData, {
      colorDisplayMode,
      expandedGroups,
      onToggleGroup,
      primaryRunName,
      comparedRunName,
    });
  }, [mergedRowData, colorDisplayMode, expandedGroups, onToggleGroup, primaryRunName, comparedRunName]);

  const headerLabels = useMemo(
    () => (mergedRowData ? getHeatMapTestCaseHeaderLabels(mergedRowData) : []),
    [mergedRowData],
  );

  const fitHeatMapColumns = useCallback(
    (api: GridApi) => {
      api.sizeColumnsToFit();
      const valueColumnWidth = getHeatMapValueColumnWidth(api);
      const headerHeight = resolveHeatMapHeaderHeight(valueColumnWidth, headerLabels);
      api.setGridOption('headerHeight', headerHeight);
      api.resetRowHeights();
      api.refreshHeader();
      api.refreshCells({ force: true });
    },
    [headerLabels],
  );

  const gridOptions = useMemo(
    () => ({
      headerHeight: resolveHeatMapHeaderHeight(0, headerLabels),
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
      postProcessPopup: centerHeatMapTooltipPopup,
    }),
    [fitHeatMapColumns, headerLabels, isDeltaMode],
  );

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
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden gap-6">
      <div className="flex-1 min-h-0 overflow-hidden heat-map-grid">
        <GridView
          key={`${primaryRunId}-${comparedRunId}`}
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
