import { TabItem } from '@epam/ai-dial-ui-kit';

import { getDatasetTestSuites } from '@/src/app/[lang]/datasets/actions';
import { getRunsQuery } from '@/src/app/[lang]/runs/actions';
import { getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { RunsI18nKey } from '@/src/constants/i18n';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult, Run, RunStatus } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { FilterOperatorDto } from '@/src/types/request';

import {
  COMPARE_RUNS_PAGE_SIZE_PER_SUITE,
  CompareRunEdge,
  CompareRunSlot,
  CompareViewTab,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_RUNS_QUERY_PARAM,
  RUN_COMPARE_SECONDARY_INDEX,
  RUN_COMPARE_SEGMENT,
} from './constants';
import { CompareCandidateRun, CompareRun, CompareRunSource } from './models';

export const getSelectableCompareRuns = (
  suiteRuns: CompareCandidateRun[],
  slot: CompareRunSlot,
  primaryRunId?: string,
  comparedRunId?: string | null,
): CompareCandidateRun[] => {
  const excludedRunId = slot === CompareRunSlot.Primary ? comparedRunId : primaryRunId;
  return suiteRuns.filter((run) => run.id !== excludedRunId);
};

/** Builds the compared runs in display order. The primary run is the baseline and is always shown first. */
export const getCompareRuns = (primary: CompareRunSource, compared: CompareRunSource): CompareRun[] => [
  { ...primary, slot: CompareRunSlot.Primary, index: RUN_COMPARE_PRIMARY_INDEX, isBaseline: true },
  { ...compared, slot: CompareRunSlot.Secondary, index: RUN_COMPARE_SECONDARY_INDEX, isBaseline: false },
];

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

/** One query for every suite rather than one per suite, so opening the picker costs a fixed number of requests. */
export const fetchSuitesCompletedRuns = async (testSuiteIds: string[]): Promise<Run[]> => {
  const res = await getRunsQuery(
    0,
    COMPARE_RUNS_PAGE_SIZE_PER_SUITE * testSuiteIds.length,
    [],
    [
      { column: 'testSuiteId', operator: FilterOperatorDto.INCLUDES, value: testSuiteIds.join(',') },
      { column: 'status', operator: FilterOperatorDto.EQUALS, value: RunStatus.COMPLETED },
    ],
  );
  return (res?.content || []) as Run[];
};

/**
 * The suite itself first, then the other suites bound to the same dataset. A suite with no dataset, or
 * a lookup that fails, degrades to the suite alone — the picker then behaves as it did before.
 */
const getDatasetSuites = async (testSuiteId: string): Promise<TestSuite[]> => {
  let suite: TestSuite | undefined;
  try {
    suite = (await getTestSuite(testSuiteId, DEFAULT_ETAG))?.response as TestSuite | undefined;
    const ownSuite: TestSuite = { id: testSuiteId, name: suite?.name };
    if (!suite?.datasetId) {
      return [ownSuite];
    }

    const siblings = ((await getDatasetTestSuites(suite.datasetId))?.response ?? []) as TestSuite[];
    return [ownSuite, ...siblings.filter((sibling) => sibling.id && sibling.id !== testSuiteId)];
  } catch {
    return [{ id: testSuiteId, name: suite?.name }];
  }
};

export const fetchCompareCandidateRuns = async (testSuiteId: string): Promise<CompareCandidateRun[]> => {
  const suites = await getDatasetSuites(testSuiteId);
  const runs = await fetchSuitesCompletedRuns(suites.map((suite) => suite.id as string));

  // The own suite's runs first, then each sibling's, as the picker has always listed them.
  return suites.flatMap((suite) =>
    runs.filter((run) => run.testSuiteId === suite.id).map((run) => ({ ...run, testSuiteName: suite.name })),
  );
};

export const getCompareViewTabs = (t: (key: string) => string): TabItem[] => [
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
