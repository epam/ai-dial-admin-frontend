import { TabModel } from '@epam/ai-dial-ui-kit';

import { getRuns } from '@/src/app/[lang]/runs/actions';
import { RunsI18nKey } from '@/src/constants/i18n';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { FilterOperatorDto } from '@/src/types/request';

import { CompareRunSlot, CompareViewTab, RUN_COMPARE_RUNS_QUERY_PARAM, RUN_COMPARE_SEGMENT } from './constants';

export const getSelectableCompareRuns = (
  suiteRuns: Run[],
  slot: CompareRunSlot,
  primaryRunId?: string,
  comparedRunId?: string | null,
): Run[] => {
  const excludedRunId = slot === CompareRunSlot.Primary ? comparedRunId : primaryRunId;
  return suiteRuns.filter((run) => run.id !== excludedRunId);
};

export const getCompareRunsPath = (primaryRunId: string, secondaryRunId: string): string => {
  const runsParam = `${encodeURIComponent(primaryRunId)},${encodeURIComponent(secondaryRunId)}`;
  return `${RUN_COMPARE_SEGMENT}?${RUN_COMPARE_RUNS_QUERY_PARAM}=${runsParam}`;
};

export const getCompareRunsUrn = (primaryRunId: string, secondaryRunId: string): string => {
  return `/runs/${getCompareRunsPath(primaryRunId, secondaryRunId)}`;
};

export const fetchSuiteCompletedRuns = async (testSuiteId: string): Promise<Run[]> => {
  const res = await getRuns(
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

export const getCompareViewTabs = (t: (key: string) => string, runsCompareEnabled: boolean): TabModel[] => [
  {
    id: CompareViewTab.SummaryOverview,
    label: t(RunsI18nKey.RunCompareTabSummaryOverview),
    disabled: !runsCompareEnabled,
  },
  {
    id: CompareViewTab.MetricsDetails,
    label: t(RunsI18nKey.RunCompareTabMetricsDetails),
    disabled: !runsCompareEnabled,
  },
  { id: CompareViewTab.ExecutionResults, label: t(RunsI18nKey.RunCompareTabExecutionResults) },
];
