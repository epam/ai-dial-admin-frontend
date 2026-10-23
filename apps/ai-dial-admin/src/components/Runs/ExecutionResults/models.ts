import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

export enum ExecutionResultRowType {
  Group = 'group',
  Result = 'result',
}

export enum TestCaseThresholdStatus {
  Pass = 'pass',
  Fail = 'fail',
  NotApplicable = 'not_applicable',
}

export interface TestCaseScoreSummary {
  runId: string;
  testCaseId?: string;
  testCaseName?: string;
  score: number | null;
  passed: boolean | null;
}

export type TestCaseScoreLookup = (
  runId: string,
  testCaseId?: string,
  testCaseName?: string,
) => TestCaseScoreSummary | undefined;

export interface ExecutionResultGroupingFields {
  resultRowType: ExecutionResultRowType;
  groupKey: string;
  isExpanded?: boolean;
  testCaseScore?: number | null;
  thresholdStatus?: TestCaseThresholdStatus;
}

export interface CompareTestCaseScores {
  primaryScore?: number | null;
  primaryThresholdStatus?: TestCaseThresholdStatus;
  comparedScore?: number | null;
  comparedThresholdStatus?: TestCaseThresholdStatus;
}

export interface OverallScoreCellValue {
  score: number | string;
  thresholdStatus?: TestCaseThresholdStatus;
}

export interface ExecutionResultColumnLabels {
  score: string;
  notApplicable: string;
}

export interface ExecutionResultColumnOptions {
  isGrouped: boolean;
  showTestCaseSummary?: boolean;
  hasThreshold: boolean;
  labels: ExecutionResultColumnLabels;
  onToggleGroup: (groupKey: string) => void;
}

export type GroupedAnalyticsResult = AnalyticsResult & ExecutionResultGroupingFields;
export type GroupedCompareAnalyticsRow = CompareAnalyticsRow & ExecutionResultGroupingFields & CompareTestCaseScores;
