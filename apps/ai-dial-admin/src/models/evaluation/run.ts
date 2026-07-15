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
}
