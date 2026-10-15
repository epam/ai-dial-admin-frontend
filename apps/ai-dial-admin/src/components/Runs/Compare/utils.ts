import { TabModel } from '@epam/ai-dial-ui-kit';

import { getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult, Run, RunStatus } from '@/src/models/evaluation/run';
import { FilterOperatorDto } from '@/src/types/request';

import {
  CompareRunEdge,
  CompareRunSlot,
  CompareViewTab,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_RUNS_QUERY_PARAM,
  RUN_COMPARE_SECONDARY_INDEX,
  RUN_COMPARE_SEGMENT,
} from './constants';
import { CompareRun, CompareRunSource } from './models';

export const getSelectableCompareRuns = (
  suiteRuns: Run[],
  slot: CompareRunSlot,
  primaryRunId?: string,
  comparedRunId?: string | null,
): Run[] => {
  const excludedRunId = slot === CompareRunSlot.Primary ? comparedRunId : primaryRunId;
  return suiteRuns.filter((run) => run.id !== excludedRunId);
};

/**
 * Builds the runs in display order. The primary run is always the baseline; `isFlipped` only changes
 * where it is shown.
 */
export const getCompareRuns = (
  primary: CompareRunSource,
  compared: CompareRunSource,
  isFlipped = false,
): CompareRun[] => {
  const runs: CompareRun[] = [
    { ...primary, slot: CompareRunSlot.Primary, index: RUN_COMPARE_PRIMARY_INDEX, isBaseline: true },
    { ...compared, slot: CompareRunSlot.Secondary, index: RUN_COMPARE_SECONDARY_INDEX, isBaseline: false },
  ];

  return isFlipped ? runs.reverse() : runs;
};

/** The result a merged row holds for a run: the row itself for the primary slot, `_compared` otherwise. */
export const getCompareRowResult = (
  row: CompareAnalyticsRow,
  slot: CompareRunSlot,
): AnalyticsResult | null | undefined => (slot === CompareRunSlot.Primary ? row : row._compared);

/** Column ids of the secondary run are the primary's with a `cmp_` prefix. */
export const getCompareRunColId = (slot: CompareRunSlot, colId: string): string =>
  slot === CompareRunSlot.Primary ? colId : `cmp_${colId}`;

/** Which end of a pair of side-by-side cells a run sits at, for edges that must close on one side only. */
export const getCompareRunEdge = (position: number): CompareRunEdge =>
  position === 0 ? CompareRunEdge.Start : CompareRunEdge.End;

export const getCompareRunsPath = (primaryRunId: string, secondaryRunId: string): string => {
  const runsParam = `${encodeURIComponent(primaryRunId)},${encodeURIComponent(secondaryRunId)}`;
  return `${RUN_COMPARE_SEGMENT}?${RUN_COMPARE_RUNS_QUERY_PARAM}=${runsParam}`;
};

export const getCompareRunsUrn = (primaryRunId: string, secondaryRunId: string): string => {
  return `/runs/${getCompareRunsPath(primaryRunId, secondaryRunId)}`;
};

export const fetchSuiteCompletedRuns = async (testSuiteId: string): Promise<Run[]> => {
  const res = await getRunsQuery(
    0,
    100,
    [],
    [
      { column: 'testSuiteId', operator: FilterOperatorDto.EQUALS, value: testSuiteId },
      { column: 'status', operator: FilterOperatorDto.EQUALS, value: RunStatus.COMPLETED },
    ],
  );
  return (res?.content || []) as Run[];
};

export const getCompareViewTabs = (t: (key: string) => string): TabModel[] => [
  {
    id: CompareViewTab.SummaryOverview,
    label: t(RunsI18nKey.RunCompareTabSummaryOverview),
  },
  {
    id: CompareViewTab.HeatMap,
    label: t(RunsI18nKey.RunCompareTabHeatMap),
  },
  { id: CompareViewTab.ExecutionResults, label: t(RunsI18nKey.RunCompareTabExecutionResults) },
];
