import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { StructuredQuery } from '@/src/models/analytics/query';
import { ChartConfig, ChartType, QueryBuilderState, QueryResultView } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';

export enum SavedQueryScope {
  Personal = 'personal',
  Common = 'common',
}

export enum SavedQueryTimeMode {
  Relative = 'relative',
  Absolute = 'absolute',
}

// Which editor a saved query opens in. Derived from the body on every read — never stored, since a
// persisted value could disagree with the query it describes.
export enum SavedQueryEditor {
  Builder = 'builder',
  Json = 'json',
  Sql = 'sql',
}

// The machine codes the analytics service returns in ErrorView.error. Each needs its own message and
// its own next step; see resolveSavedQueryError.
export enum SavedQueryErrorCode {
  BadRequest = 'bad_request',
  SensitiveLiteralNotAllowed = 'sensitive_literal_not_allowed',
  ValidationError = 'validation_error',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  PrincipalUnavailable = 'principal_unavailable',
}

// Which shape the save dialog takes: a fresh save, a copy of the loaded query, or a metadata-only edit
// that leaves the stored body as it is.
export enum SaveQueryDialogMode {
  Create = 'create',
  SaveAsNew = 'save-as-new',
  Rename = 'rename',
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

// Axis fields name *result* columns (often aliases the query itself produces), not catalog columns.
// `null` means the user never picked, which is what re-derives the axis against whatever the query
// returns on open — so unlike every other optional member these are sent as explicit nulls.
export interface SavedQueryChart {
  type: ChartType;
  x_field: string | null;
  y_field: string | null;
}

// A stored saved query as the service returns it. Null members are omitted rather than emitted, so
// every optional field is declared optional and none is ever compared against null.
export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  scope: SavedQueryScope;
  owner_id?: string;
  // Display only, a snapshot taken at creation, often absent. Every ownership and permission decision
  // is made from scope and the caller's own role — never by comparing this.
  owner_email?: string;
  source?: string;
  query?: StructuredQuery;
  sql?: string;
  time?: SavedQueryTime;
  result_view: QueryResultView;
  chart?: SavedQueryChart;
  generation: number;
  created_at: string;
  updated_at: string;
}

// The only fields a create or replace accepts. Deliberately a separate type rather than a Pick of
// SavedQuery: sending id, owner_id, owner_email, source, generation, created_at, updated_at or params
// is a 422 — rejected, not ignored — so a response object must never be round-tripped as a request.
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

// One tag's worth of rows in the library list. An absent tag is the untagged group.
export interface SavedQueryGroup {
  tag?: string;
  queries: SavedQuery[];
}

// What the save dialog collects. The body itself comes from live builder state, so this is only the
// metadata plus the two choices about what gets captured alongside it.
export interface SaveQueryForm {
  name: string;
  description: string;
  tag: string;
  scope: SavedQueryScope;
  captureTime: boolean;
  saveAsChart: boolean;
}

// Everything toSavedQueryRequest needs, passed by value: the mapping resolves no state and reads no
// clock, so a caller supplies the already-resolved time range rather than a getter.
export interface SavedQueryCaptureInput {
  state: QueryBuilderState;
  sqlText: string | null;
  name: string;
  description: string;
  tag: string;
  scope: SavedQueryScope;
  timePeriod: string;
  isCustom: boolean;
  timeRange: TimeRange;
  captureTime: boolean;
  resultView: QueryResultView;
  chartConfig: ChartConfig;
}

// What the toolbar should do with a loaded query's time intent. Leave is both "the query stored no
// time" and "it stored a period this deployment does not offer" — neither is worth failing a load over.
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
  jsonText: string;
  time: SavedQueryTimeRestore;
  resultView: QueryResultView;
  // Absent when the query was saved as a table, which leaves the live chart config alone rather than
  // resetting it.
  chartConfig?: ChartConfig;
}

export interface SavedQueryRestoreInput {
  saved: SavedQuery;
  fields: AnalyticsEntityField[];
  functions: QueryBuilderState['functions'];
  knownPeriods: string[];
}
