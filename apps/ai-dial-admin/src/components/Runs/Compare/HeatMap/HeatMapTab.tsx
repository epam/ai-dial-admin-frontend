'use client';

import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getRun, getTestCaseRunResults } from '@/src/app/[lang]/runs/actions';
import HeatMapGrid from '@/src/components/Common/HeatMap/HeatMapGrid';
import { HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE } from '@/src/components/Common/HeatMap/constants';
import { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { buildHeatMapColumns } from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-columns';
import {
  buildHeatMapRowsForMode,
  filterHeatMapRowsByExpandedGroups,
  filterHeatMapRowsByMetricGroups,
  getHeatMapGroupKeys,
} from '@/src/components/Runs/Compare/HeatMap/utils/build-heat-map-rows';
import { getHeatMapTestCaseHeaderLabels } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-test-case-columns';
import { HeatMapTabUiState } from '@/src/components/Runs/Compare/models';
import { mergeByTestCaseId, isMatchedCompareRow, RESULT_FILTERS } from '@/src/components/Runs/View/utils';
import { EntitiesI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  onlyMatchingTestCases: boolean;
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
  onlyMatchingTestCases,
  colorDisplayMode,
  onColorDisplayModeChange: _onColorDisplayModeChange,
  selectedMetricGroups,
  onAvailableMetricGroupsChange,
  heatMapState,
  setHeatMapState,
}) => {
  const t = useI18n();
  const { currentTheme } = useTheme();

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
    const merged = mergeByTestCaseId(results, comparedResults);
    return onlyMatchingTestCases ? merged.filter(isMatchedCompareRow) : merged;
  }, [results, comparedResults, onlyMatchingTestCases]);

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
      theme: currentTheme,
    });
  }, [mergedRowData, colorDisplayMode, expandedGroups, onToggleGroup, primaryRunName, comparedRunName, currentTheme]);

  const headerLabels = useMemo(
    () => (mergedRowData ? getHeatMapTestCaseHeaderLabels(mergedRowData) : []),
    [mergedRowData],
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
    <HeatMapGrid
      gridKey={`${primaryRunId}-${comparedRunId}`}
      columnDefs={columnDefs}
      rowData={visibleRows}
      headerLabels={headerLabels}
      emptyTitle={t(EntitiesI18nKey.NoResults)}
      valueColumnIdPrefix={HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE}
      colorScaleVariant={isDeltaMode ? ColorScaleVariant.Delta : ColorScaleVariant.Compact}
    />
  );
};

export default HeatMapTab;
