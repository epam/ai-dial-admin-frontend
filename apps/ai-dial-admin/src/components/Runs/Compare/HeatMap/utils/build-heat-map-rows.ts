import { formatHeatMapTestCaseColId } from '@/src/components/Runs/Compare/HeatMap/constants';
import { HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const mergeMetricValuesSchema = (results: AnalyticsResult[]): Record<string, Record<string, unknown>> => {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const result of results) {
    const metricValues = result.metricValues;
    if (!metricValues) continue;
    for (const [groupKey, groupValues] of Object.entries(metricValues)) {
      if (!merged[groupKey]) merged[groupKey] = {};
      for (const [key, value] of Object.entries(groupValues)) {
        if (!(key in merged[groupKey])) merged[groupKey][key] = value;
      }
    }
  }
  return merged;
};

const getTestCaseKey = (row: AnalyticsResult): string => row.testCaseId || row.testCaseName || row.id || '';

const parseMetricValue = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  return null;
};

const buildMetricValuesForRun = (
  mergedRows: CompareAnalyticsRow[],
  groupKey: string,
  metricKey: string,
  isCompared: boolean,
): Record<string, number | null | undefined> => {
  const values: Record<string, number | null | undefined> = {};

  for (const row of mergedRows) {
    const testCaseKey = getTestCaseKey(row);
    const colId = formatHeatMapTestCaseColId(testCaseKey);
    const source = isCompared ? row._compared : row;
    const groupExists = source?.metricValues != null && groupKey in source.metricValues;

    if (!groupExists) {
      values[colId] = undefined;
      continue;
    }

    const raw = source?.metricValues?.[groupKey]?.[metricKey];
    values[colId] = parseMetricValue(raw);
  }

  return values;
};

export const buildHeatMapRows = (mergedRows: CompareAnalyticsRow[]): HeatMapRow[] => {
  const allResults: AnalyticsResult[] = [
    ...mergedRows,
    ...mergedRows.flatMap((row) => (row._compared ? [row._compared] : [])),
  ];
  const metricsSchema = mergeMetricValuesSchema(allResults);
  const rows: HeatMapRow[] = [];

  for (const [groupKey, groupValues] of Object.entries(metricsSchema)) {
    rows.push({
      id: `group_${groupKey}`,
      rowType: HeatMapRowType.Group,
      groupKey,
      label: groupKey,
      values: {},
    });

    for (const metricKey of Object.keys(groupValues)) {
      const primaryValues = buildMetricValuesForRun(mergedRows, groupKey, metricKey, false);
      const comparedValues = buildMetricValuesForRun(mergedRows, groupKey, metricKey, true);

      rows.push({
        id: `metric_${groupKey}_${RUN_COMPARE_PRIMARY_INDEX}_${metricKey}`,
        rowType: HeatMapRowType.Metric,
        groupKey,
        metricKey,
        runIndex: RUN_COMPARE_PRIMARY_INDEX,
        label: metricKey,
        values: primaryValues,
      });

      rows.push({
        id: `metric_${groupKey}_${RUN_COMPARE_SECONDARY_INDEX}_${metricKey}`,
        rowType: HeatMapRowType.Metric,
        groupKey,
        metricKey,
        runIndex: RUN_COMPARE_SECONDARY_INDEX,
        label: metricKey,
        values: comparedValues,
      });
    }
  }

  return rows;
};

export const filterHeatMapRowsByExpandedGroups = (rows: HeatMapRow[], expandedGroups: Set<string>): HeatMapRow[] =>
  rows.filter((row) => row.rowType === HeatMapRowType.Group || expandedGroups.has(row.groupKey));

export const getHeatMapGroupKeys = (rows: HeatMapRow[]): string[] =>
  rows.filter((row) => row.rowType === HeatMapRowType.Group).map((row) => row.groupKey);
