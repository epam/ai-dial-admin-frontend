import { DialScheme } from '@/src/models/dial/scheme';
import { FilterNode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { FormDataPart } from '@/src/models/form-data';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

export enum SuiteType {
  Deployment = 'DEPLOYMENT',
  McpTool = 'MCP_TOOL',
}

export enum OverallScoreType {
  Mean = 'mean',
  WeightedMean = 'weighted_mean',
  Function = 'custom_function',
}

export interface OverallScoreWeight {
  metricName: string;
  outputField: string;
  weight: number;
}

export interface OverallScoreMean {
  type: OverallScoreType.Mean;
}

export interface OverallScoreWeightedMean {
  type: OverallScoreType.WeightedMean;
  weights: OverallScoreWeight[];
}

export interface OverallScoreFunction {
  type: OverallScoreType.Function;
  expression: StructuredQuery;
}

export type OverallScoreConfig = OverallScoreMean | OverallScoreWeightedMean | OverallScoreFunction;

export interface TestSuite {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  valid?: boolean;
  validationWarnings?: ValidationWarning[];
  suiteType?: SuiteType;
  datasetId?: string;
  disabledTestCaseIds?: string[];
  testCaseFilter?: FilterNode | null;
  overallScoreThreshold?: number;
  overallScore?: OverallScoreConfig;

  deploymentRef?: TestSuiteDeploymentRef;
  /**
   * `endpointRef`/`requestTemplate`/`inputBindings`/`responseColumns` are request `#0` of the chain,
   * labelled by `requestName`; `additionalRequests` holds requests `1..N`, each shaped identically.
   */
  endpointRef?: TestSuiteEndpointRef;
  requestTemplate?: TestSuiteRequestTemplate;
  inputBindings?: InputBinding[];
  responseColumns?: ResponseColumn[];
  requestName?: string;
  additionalRequests?: TestSuiteAdditionalRequest[];

  mcpDeploymentRef?: McpDeploymentRef;
  toolRef?: ToolRef;
  argumentTemplate?: ArgumentTemplate;
}

export interface TestSuiteAdditionalRequest {
  name?: string;
  endpointRef?: TestSuiteEndpointRef;
  requestTemplate?: TestSuiteRequestTemplate;
  responseColumns?: ResponseColumn[];
  inputBindings?: InputBinding[];
}

/** Frozen suite configuration captured when a test suite run starts. */
export interface SuiteSnapshot {
  snapshotVersion?: string;
  suiteType?: SuiteType;
  deploymentRef?: TestSuiteDeploymentRef;
  mcpDeploymentRef?: McpDeploymentRef;
  requestName?: string;
  additionalRequests?: TestSuiteAdditionalRequest[];
}

export interface McpDeploymentRef {
  id: string;
  type: string;
  name: string;
}

export interface ToolRef {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ArgumentTemplate {
  arguments: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  fieldName: string;
}

export interface TestSuiteDeploymentRef {
  id?: string;
  name?: string;
  version?: string;
  type?: string;
}

export interface TestSuiteEndpointRef {
  method?: string;
  relativeUrlPattern?: string;
  parameters?: Record<string, unknown>[];
  requestBodySchema?: RequestBodySchema;
  responseBodySchema?: DialScheme;
}

export interface RequestBodySchema {
  contentType: string;
  schema: DialScheme;
}

export interface TestSuiteRequestTemplate {
  urlTemplate?: string;
  body?: TestSuiteRequestTemplateBody;
  headers?: TestSuiteRequestTemplateParam[];
  queryParams?: TestSuiteRequestTemplateParam[];
}

export interface TestSuiteRequestTemplateBody {
  contentType?: string;
  content?: Record<string, unknown> | FormDataPart[];
  jsonataContent?: string;
}

export interface TestSuiteRequestTemplateParam {
  key: string;
  value: string;
}

export interface TestCase {
  testCaseName?: string;
  updatedAt?: number;
  valid?: boolean;
  id: string;
  createdAt: number;
  data?: Record<string, unknown>;
  multiTurnData?: Record<string, unknown>[];
  validationWarnings?: ValidationWarning[];
  enabled?: boolean;
}

export interface TemplateVariable {
  defaultValue: unknown;
  hasDefault: boolean;
  effectiveType: TestCaseItemType;
  name: string;
  sources: string[];
  resolvedValue?: unknown;
}

export interface TestCaseSchema {
  name: string;
  type: TestCaseItemType;
  required: boolean;
  description: string;
  perTurn?: boolean;
}

export interface InputBinding {
  templateVariable: string;
  dataField?: string;
  constantValue?: unknown;
}

export interface InputBindingRowData extends InputBinding {
  effectiveType?: TestCaseItemType;
  type?: InputBindingType;
  value?: unknown;
  defaultValue?: unknown;
}

/** Terminal parse status of a streamed response; anything but `Success` means the invocation failed. */
export enum StreamingStatus {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Timeout = 'TIMEOUT',
  Error = 'ERROR',
}

/** One column whose backend extraction failed, carrying the expression that was actually evaluated. */
export interface ExtractionWarning {
  column: string;
  expression: string;
  error: string;
}

/** The invoked endpoint's own reply, as reported inside a try-out envelope. */
export interface TryOutCoreResponse {
  statusCode: number;
  body?: unknown;
  streaming?: boolean;
  events?: unknown[];
  streamingStatus?: StreamingStatus;
  truncationWarning?: string;
  [key: string]: unknown;
}

/**
 * `extractedColumns` is the backend's own reconciled extraction for this one invocation — a column
 * whose extraction failed appears with an explicit `null`. Both fields are absent when no extraction
 * was performed: the suite declares no response columns, the invocation failed, or the try-out is MCP.
 */
interface TryOutExtraction {
  extractedColumns?: Record<string, unknown>;
  extractionWarnings?: ExtractionWarning[];
}

export interface TryOutHistoryEntry extends TryOutExtraction {
  resolvedRequest: Record<string, unknown>;
  response: TryOutCoreResponse;
  durationMs?: number;
  traceId?: string;
  grafanaTraceUrl?: string;
  requestIndex?: number;
  turnIndex?: number;
}

export interface TryOutResponse extends TryOutExtraction {
  resolvedRequest: Record<string, unknown>;
  response: TryOutCoreResponse;
  grafanaTraceUrl?: string;
  history?: TryOutHistoryEntry[];
}

export interface ArgumentRow {
  name: string;
  type: string;
  value: unknown;
}

export interface ResponseColumn {
  name: string;
  displayName: string;
  expression: string;
  type: string;
}
