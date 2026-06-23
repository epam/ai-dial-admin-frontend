export enum CompareRunSlot {
  Primary = 'primary',
  Secondary = 'secondary',
}

export enum CompareViewTab {
  SummaryOverview = 'summaryOverview',
  MetricsDetails = 'metricsDetails',
  ExecutionResults = 'executionResults',
}

export const RUN_COMPARE_SEGMENT = 'compare';
export const RUN_COMPARE_RUNS_QUERY_PARAM = 'runs';

export const RUN_COMPARE_PRIMARY_INDEX = '1';
export const RUN_COMPARE_SECONDARY_INDEX = '2';

export const formatCompareRunIndexHeader = (runIndex: string) => `[${runIndex}]`;
