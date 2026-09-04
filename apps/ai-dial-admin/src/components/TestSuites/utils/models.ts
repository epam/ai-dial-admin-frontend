import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { Deployment } from '@/src/models/evaluation/deployment';
import {
  ExtractionWarning,
  TestSuite,
  TestSuiteEndpointRef,
  TryOutCoreResponse,
} from '@/src/models/evaluation/test-suite';
import { TryOutSectionShape } from '@/src/utils/evaluation/tryout-sections';

export interface ParsedTemplateParam {
  name: string;
  hasDefault: boolean;
  defaultValue?: string;
}

export interface MethodOption {
  /** Endpoint reference stored on the suite when this option is selected. */
  ref: TestSuiteEndpointRef;
  /**
   * Readable URL for the sidebar. Kept out of `ref` because `relativeUrlPattern` is a regex the
   * final path is validated against, not something a user should have to read.
   */
  displayUrl: string;
  /** Suite fields written when this option is selected. */
  seed: Partial<TestSuite>;
}

export interface MethodGroup {
  titleKey: TestSuitesI18nKey;
  options: MethodOption[];
}

export interface BuildMethodGroupsParams {
  deployment?: Deployment | null;
  endpointRef?: TestSuiteEndpointRef;
  takenColumnNames?: string[];
}

/** What a Try Out column result says happened to that column on one invocation. */
export enum ColumnExtractionStatus {
  Extracted = 'EXTRACTED',
  Failed = 'FAILED',
  NotExtracted = 'NOT_EXTRACTED',
}

/** Why an invocation reported no extraction at all. */
export enum NotExtractedReason {
  RequestFailed = 'REQUEST_FAILED',
  StreamIncomplete = 'STREAM_INCOMPLETE',
  NoExtractionReported = 'NO_EXTRACTION_REPORTED',
}

export interface EvaluatedColumn {
  name: string;
  /** The expression that produced this result — the backend's when it reported one. */
  expression: string;
  type: string;
  status: ColumnExtractionStatus;
  /** Formatted extracted value; empty unless `status` is `Extracted`. */
  result: string;
  /** Backend error text, set only for `Failed` and only when a warning named the column. */
  error?: string;
  /** Set only for `NotExtracted`. */
  reason?: NotExtractedReason;
  /** Response status behind a `RequestFailed` reason. */
  statusCode?: number;
}

/** The part of a try-out envelope one invocation's column results are derived from. */
export interface TryOutInvocation {
  response?: TryOutCoreResponse;
  extractedColumns?: Record<string, unknown>;
  extractionWarnings?: ExtractionWarning[];
}

export interface TryOutColumnTurnResult {
  turnIndex: number;
  columns: EvaluatedColumn[];
  responseBody?: unknown;
}

export interface TryOutColumnGroupResult {
  requestIndex: number;
  showTurnLabels: boolean;
  turns: TryOutColumnTurnResult[];
}

export interface TryOutColumnResults {
  shape: TryOutSectionShape;
  flatColumns?: EvaluatedColumn[];
  groups?: TryOutColumnGroupResult[];
}
