import { SuiteSnapshot } from '@/src/models/evaluation/test-suite';

export interface ResultDto {
  id?: string;
  createdAt?: number;
  testCaseId?: string;
  testSuiteId?: string;
  testCaseName?: string;
  testSuiteRunId?: string;
  responseStatusCode: number;
  runIndex: number;
  turnIndex?: number;
  totalTurns?: number;
  requestIndex?: number;
  totalRequests?: number;

  testCaseData?: Record<string, unknown>;
  extractedColumns?: Record<string, unknown>;
}
export interface ExtractionResult extends ResultDto {
  executionInfo?: {
    status?: ExtractionResultStatus;
    startedAt?: number;
    completedAt?: number;
    traceId?: string;
    durationMs?: number;
    grafanaTraceUrl?: string;
  };
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  grafanaExploreUrl?: string;
}

export interface AnalyticsResult extends ResultDto {
  executionStatus?: ExtractionResultStatus;
  execDurationMs?: number;
  metricValues?: Record<string, Record<string, unknown>>;
  metricInfos?: Record<string, Record<string, unknown>>;
  computationId?: string;
  computedAt?: number;
  testCaseRunResultsId?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  grafanaTraceUrl?: string;
}

export enum ExtractionResultStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  ERROR = 'ERROR',
}

export interface Run {
  id?: string;
  testSuiteId?: string;
  testRunName?: string;
  status?: RunStatus;
  runConfig?: {
    numberOfRuns?: number;
    testRunName?: string;
  };
  numberOfTestCases?: number;
  suiteSnapshot?: SuiteSnapshot;
  metricNames?: string[];
  /**
   * Purely display values: the eval service appends these to a `test_suite_runs` query row after the
   * query itself runs, so neither is selectable, sortable, or filterable through the query DSL, and
   * either may be absent.
   */
  overallScoreValue?: number;
  totalCost?: number;
  grafanaExploreUrl?: string;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  errorDetails?: {
    code?: string;
    category?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  createdAt?: number;
  updatedAt?: number;
  /** Rows for the Extraction results tab (per–test-case metrics and extracted values) */
  extractionResults?: ExtractionResult[];
}

export enum RunStatus {
  COMPLETED = 'COMPLETED',
  RUNNING = 'RUNNING',
  FAILED = 'FAILED',
  CANCELLING = 'CANCELLING',
  CANCELLED = 'CANCELLED',
}

/** Display label for a run target's kind — the second line of the runs-list Target cell. */
export enum RunTargetKind {
  Application = 'Application',
  Model = 'Model',
  Mcp = 'MCP',
}

/**
 * The entity a run evaluated, resolved from its `suiteSnapshot`. `kind` is left unset rather than
 * guessed when the snapshot's deployment ref carries no recognizable type (see
 * `resolveRunTarget` in `Runs/utils/run-list-values.ts`).
 */
export interface RunTarget {
  name: string;
  kind?: RunTargetKind;
}

/** Averages from GET /api/v1/test-suite-runs/{id}/costs (null when no usage-log rows for that phase). */
export interface RunCosts {
  avgTestCaseCost: number | null;
  avgMetricEvalCost: number | null;
}
