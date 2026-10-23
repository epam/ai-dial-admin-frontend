import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';

export interface StabilitySummaryRow {
  test_suite_run_id?: string;
  test_case_name?: string;
  score?: number | null;
  passed?: boolean | null;
}

export interface StabilityCellMeta {
  score: number | null | undefined;
  passed: boolean | null | undefined;
}

export interface StabilityMatrix {
  rows: HeatMapGridRow[];
  cellMeta: Record<string, Record<string, StabilityCellMeta>>;
  headerLabels: string[];
  testCaseColIds: string[];
}
