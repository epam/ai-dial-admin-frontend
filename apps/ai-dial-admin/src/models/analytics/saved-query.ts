import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { ChartConfig, ChartType, QueryBuilderState, QueryResultView } from '@/src/models/analytics/query-builder';
import { StructuredQuery } from '@/src/models/analytics/query';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { TimeRange } from '@/src/models/time-range';

export enum SavedQueryScope {
  Personal = 'personal',
  Common = 'common',
}

export enum SavedQueryTimeMode {
  Relative = 'relative',
  Absolute = 'absolute',
}

export enum SavedQueryEditor {
  Builder = 'builder',
  Sql = 'sql',
}

export enum SavedQueryErrorCode {
  BadRequest = 'bad_request',
  ValidationError = 'validation_error',
  SensitiveLiteralNotAllowed = 'sensitive_literal_not_allowed',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  PrincipalUnavailable = 'principal_unavailable',
}

export interface SavedQueryRelativeTime {
  mode: SavedQueryTimeMode.Relative;
  period: string;
}

export interface SavedQueryAbsoluteTime {
  mode: SavedQueryTimeMode.Absolute;
  from: string;
  to: string;
}

export type SavedQueryTime = SavedQueryRelativeTime | SavedQueryAbsoluteTime;

export interface SavedQueryChartLegend {
  visible?: boolean;
  position?: string;
}

export interface SavedQueryChart {
  type: ChartType;
  x_field: string | null;
  y_field: string[] | null;
  legend?: SavedQueryChartLegend;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  scope: SavedQueryScope;
  owner_id?: string;
  owner_email?: string;
  source?: string[];
  query?: StructuredQuery;
  sql?: string;
  time?: SavedQueryTime;
  result_view?: QueryResultView;
  chart?: SavedQueryChart;
  generation: number;
  created_at: string;
  updated_at: string;
}

// Declared independently of SavedQuery, not a Pick/Omit: the service rejects server-assigned members
// with 422, so a derived type would silently send any member later added to the response.
export interface SavedQueryRequest {
  name: string;
  description?: string;
  tag?: string;
  scope: SavedQueryScope;
  query?: StructuredQuery;
  sql?: string;
  time?: SavedQueryTime;
  result_view: QueryResultView;
  chart?: SavedQueryChart;
}

export interface SavedQueryListResponse {
  saved_queries: SavedQuery[];
}

// The metadata members a caller supplies, shared by a full capture and a metadata-only replace.
export interface SavedQueryMetadata {
  name: string;
  description?: string;
  tag?: string;
  scope: SavedQueryScope;
}

export interface SavedQueryTimeIntentInput {
  period: string;
  isCustom: boolean;
  range: TimeRange;
}

export interface SavedQueryCaptureInput {
  name: string;
  description?: string;
  tag?: string;
  scope: SavedQueryScope;
  state: QueryBuilderState;
  sqlText?: string | null;
  fallbackQuery?: StructuredQuery;
  time?: SavedQueryTimeIntentInput;
  resultView: QueryResultView;
  chartConfig?: ChartConfig;
}

export enum SavedQueryTimeAction {
  ApplyPeriod = 'apply-period',
  ApplyRange = 'apply-range',
  Leave = 'leave',
}

export interface SavedQueryTimeRestore {
  action: SavedQueryTimeAction;
  period?: string;
  range?: TimeRange;
}

export interface SavedQueryRestore {
  editor: SavedQueryEditor;
  state: QueryBuilderState;
  sqlText: string;
  unloadedQuery?: StructuredQuery;
  time: SavedQueryTimeRestore;
  resultView: QueryResultView;
  chartConfig?: ChartConfig;
}

export interface StoredTimeBoundInput {
  saved: SavedQuery;
  fields: AnalyticsEntityField[];
  functions: QueryFunction[];
  knownPeriods: string[];
  periodRange: (period: string) => TimeRange;
}

export interface SavedQueryRestoreInput {
  saved: SavedQuery;
  fields: AnalyticsEntityField[];
  functions: QueryFunction[];
  knownPeriods: string[];
  translatedSql?: string | null;
}
