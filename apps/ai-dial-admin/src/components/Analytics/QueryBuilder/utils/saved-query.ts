import { StructuredQuery } from '@/src/models/analytics/query';
import { ChartConfig, QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryMetadata,
  SavedQueryChart,
  SavedQueryEditor,
  SavedQueryRequest,
  SavedQueryRestore,
  SavedQueryRestoreInput,
  SavedQueryTime,
  SavedQueryTimeAction,
  SavedQueryTimeIntentInput,
  SavedQueryTimeMode,
  SavedQueryTimeRestore,
} from '@/src/models/analytics/saved-query';
import { TimeRange } from '@/src/models/time-range';
import { buildQuery } from './serialize';
import { isBuilderRepresentable, parseQuery } from './deserialize';
import { createInitialState } from './state';

const JSON_INDENT = 2;

const trimmed = (value?: string): string | undefined => {
  const next = value?.trim();
  return next ? next : void 0;
};

const toSavedQueryTime = (time: SavedQueryTimeIntentInput): SavedQueryTime => {
  if (!time.isCustom) {
    return { mode: SavedQueryTimeMode.Relative, period: time.period };
  }
  const { startDate, endDate } = time.range;
  const isInverted = startDate.getTime() > endDate.getTime();
  return {
    mode: SavedQueryTimeMode.Absolute,
    from: (isInverted ? endDate : startDate).toISOString(),
    to: (isInverted ? startDate : endDate).toISOString(),
  };
};

const toSavedQueryChart = (chartConfig: ChartConfig): SavedQueryChart => ({
  type: chartConfig.type,
  x_field: chartConfig.xField,
  y_field: chartConfig.yField,
});

interface SavedQueryRequestParts {
  meta: SavedQueryMetadata;
  body: Pick<SavedQueryRequest, 'query' | 'sql'>;
  time?: SavedQueryTime;
  resultView: QueryResultView;
  chart?: SavedQueryChart;
}

/**
 * The single place a write payload is assembled. Every caller goes through it, because dirty detection
 * compares JSON.stringify of this payload against a baseline: two callers assembling the same content in
 * different key orders would read as a change that isn't one.
 */
const assembleRequest = ({ meta, body, time, resultView, chart }: SavedQueryRequestParts): SavedQueryRequest => {
  const request: SavedQueryRequest = {
    name: meta.name.trim(),
    scope: meta.scope,
    result_view: resultView,
  };

  const description = trimmed(meta.description);
  if (description) request.description = description;

  const tag = trimmed(meta.tag);
  if (tag) request.tag = tag;

  if (body.sql) request.sql = body.sql;
  else if (body.query) request.query = body.query;

  if (time) request.time = time;
  if (chart) request.chart = chart;

  return request;
};

// A JSON body the builder cannot display, parsed from its editor buffer. Unparseable text yields null,
// leaving the builder state as the body rather than sending something the service would reject.
const parseDivergedBody = (jsonText?: string | null): StructuredQuery | null => {
  if (!jsonText?.trim()) return null;
  try {
    return JSON.parse(jsonText) as StructuredQuery;
  } catch {
    return null;
  }
};

export const toSavedQueryRequest = (input: SavedQueryCaptureInput): SavedQueryRequest => {
  const sql = trimmed(input.sqlText ?? void 0);
  const divergedBody = parseDivergedBody(input.divergedJsonText);

  return assembleRequest({
    meta: input,
    // Exactly one body, in precedence order: a non-blank SQL buffer is the authored query; failing that a
    // diverged JSON buffer, whose edits the builder state does not carry; failing that the builder state.
    // The null time bound is deliberate — a persisted range would freeze the query to its authoring date.
    body: sql ? { sql } : { query: divergedBody ?? buildQuery(input.state, null) },
    time: input.time ? toSavedQueryTime(input.time) : void 0,
    resultView: input.resultView,
    chart:
      input.resultView === QueryResultView.Chart && input.chartConfig ? toSavedQueryChart(input.chartConfig) : void 0,
  });
};

/**
 * Replaces a stored query's metadata, carrying its body, time intent, and chart across untouched — the
 * edit modal renames and re-tags, it does not re-author.
 */
export const toMetadataUpdateRequest = (saved: SavedQuery, meta: SavedQueryMetadata): SavedQueryRequest =>
  assembleRequest({
    meta,
    body: saved.sql ? { sql: saved.sql } : { query: saved.query },
    time: saved.time,
    resultView: saved.result_view ?? QueryResultView.Table,
    chart: saved.chart,
  });

export const deriveSavedQueryEditor = (saved: Pick<SavedQuery, 'sql' | 'query'>): SavedQueryEditor => {
  if (saved.sql?.trim()) return SavedQueryEditor.Sql;
  if (saved.query && isBuilderRepresentable(saved.query)) return SavedQueryEditor.Builder;
  return saved.query ? SavedQueryEditor.Json : SavedQueryEditor.Builder;
};

export const savedQueryEntityName = (saved: Pick<SavedQuery, 'query' | 'source'>): string =>
  saved.query?.entity ?? saved.source ?? '';

const parseInstant = (value: string): Date | null => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const toTimeRestore = (time: SavedQuery['time'], knownPeriods: string[]): SavedQueryTimeRestore => {
  if (!time) return { action: SavedQueryTimeAction.Leave };

  if (time.mode === SavedQueryTimeMode.Relative) {
    return knownPeriods.includes(time.period)
      ? { action: SavedQueryTimeAction.ApplyPeriod, period: time.period }
      : { action: SavedQueryTimeAction.Leave };
  }

  const from = parseInstant(time.from);
  const to = parseInstant(time.to);
  if (!from || !to) return { action: SavedQueryTimeAction.Leave };

  const isInverted = from.getTime() > to.getTime();
  const range: TimeRange = {
    startDate: isInverted ? to : from,
    endDate: isInverted ? from : to,
  };
  return { action: SavedQueryTimeAction.ApplyRange, range };
};

export const toBuilderRestore = (input: SavedQueryRestoreInput): SavedQueryRestore => {
  const { saved, fields, functions, knownPeriods } = input;
  const entityName = savedQueryEntityName(saved);

  const state = saved.query
    ? parseQuery(saved.query, fields, functions)
    : { ...createInitialState(functions), entityName, fields };

  return {
    editor: deriveSavedQueryEditor(saved),
    state,
    sqlText: saved.sql ?? '',
    jsonText: saved.query ? JSON.stringify(saved.query, null, JSON_INDENT) : '',
    time: toTimeRestore(saved.time, knownPeriods),
    resultView: saved.result_view ?? QueryResultView.Table,
    chartConfig: saved.chart
      ? { type: saved.chart.type, xField: saved.chart.x_field, yField: saved.chart.y_field }
      : void 0,
  };
};
