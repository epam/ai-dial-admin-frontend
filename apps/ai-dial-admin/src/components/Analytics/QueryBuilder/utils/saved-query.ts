import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { StructuredQuery } from '@/src/models/analytics/query';
import { DEFAULT_CHART_LEGEND } from '@/src/constants/analytics/query-builder';
import {
  ChartConfig,
  ChartLegendConfig,
  ChartLegendPosition,
  QueryResultView,
  QueryTimeBound,
} from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryMetadata,
  SavedQueryChart,
  SavedQueryChartLegend,
  SavedQueryEditor,
  SavedQueryRequest,
  SavedQueryRestore,
  SavedQueryRestoreInput,
  SavedQueryTime,
  SavedQueryTimeAction,
  SavedQueryTimeIntentInput,
  SavedQueryTimeMode,
  SavedQueryTimeRestore,
  StoredTimeBoundInput,
} from '@/src/models/analytics/saved-query';
import { TimeRange } from '@/src/models/time-range';
import { buildQuery } from './serialize';
import { isChipRepresentable, parseQuery } from './deserialize';
import { createInitialState } from './state';
import { formatSql } from './sql-format';
import { findTimestampField, withTimeBound } from './time';

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

export const readChartYFields = (yField: SavedQueryChart['y_field'] | string | undefined): string[] | null => {
  if (yField == null) return null;
  const entries: unknown[] = typeof yField === 'string' ? [yField] : yField;
  return entries.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '');
};

const toSavedQueryChart = (chartConfig: ChartConfig): SavedQueryChart => {
  const legend = chartConfig.legend ?? DEFAULT_CHART_LEGEND;
  return {
    type: chartConfig.type,
    x_field: chartConfig.xField,
    y_field: chartConfig.yFields,
    legend: { visible: legend.isVisible, position: legend.position },
  };
};

const LEGEND_POSITIONS: string[] = Object.values(ChartLegendPosition);

export const readChartLegend = (legend: SavedQueryChartLegend | undefined): ChartLegendConfig => ({
  isVisible: typeof legend?.visible === 'boolean' ? legend.visible : DEFAULT_CHART_LEGEND.isVisible,
  position:
    legend?.position && LEGEND_POSITIONS.includes(legend.position)
      ? (legend.position as ChartLegendPosition)
      : DEFAULT_CHART_LEGEND.position,
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

export const toSavedQueryRequest = (input: SavedQueryCaptureInput): SavedQueryRequest => {
  const sql = trimmed(input.sqlText ?? void 0);

  return assembleRequest({
    meta: input,
    body: sql ? { sql } : { query: input.fallbackQuery ?? buildQuery(input.state, null) },
    time: input.time ? toSavedQueryTime(input.time) : void 0,
    resultView: input.resultView,
    chart:
      input.resultView === QueryResultView.Chart && input.chartConfig ? toSavedQueryChart(input.chartConfig) : void 0,
  });
};

/**
 * Takes a stored query's authored content — body, time intent, result view, and chart — and pairs it with
 * a fresh set of metadata. Neither caller re-authors: the edit modal replaces the same query under new
 * metadata, and the duplicate modal creates a second one from the same content.
 */
export const toMetadataReplaceRequest = (saved: SavedQuery, meta: SavedQueryMetadata): SavedQueryRequest =>
  assembleRequest({
    meta,
    body: saved.sql ? { sql: saved.sql } : { query: saved.query },
    time: saved.time,
    resultView: saved.result_view ?? QueryResultView.Table,
    chart: saved.chart,
  });

export const deriveSavedQueryEditor = (
  saved: Pick<SavedQuery, 'sql' | 'query'>,
  functions: QueryFunction[],
  fields: AnalyticsEntityField[],
): SavedQueryEditor => {
  if (saved.sql?.trim()) return SavedQueryEditor.Sql;
  if (!saved.query) return SavedQueryEditor.Builder;
  return isChipRepresentable(saved.query, functions, fields) ? SavedQueryEditor.Builder : SavedQueryEditor.Sql;
};

// A deployment may still answer with a single name rather than a list, so every read of `source` goes
// through this rather than indexing the member: indexing a string would yield its first character.
const savedQuerySources = (source: SavedQuery['source']): string[] => {
  if (Array.isArray(source)) return source;
  return typeof source === 'string' && source ? [source] : [];
};

// The one entity a saved query is treated as being about, for every consumer needing exactly one: the
// schema prefetch, SQL autocomplete, and the assistant's schema message. A SQL
// body falls back to the first source, which for a composite statement is the alphabetically first
// entity the service reports — arbitrary but stable, and better than no field suggestions at all.
// `''` means nothing resolved, which callers read as "load no schema".
export const savedQueryPrimarySource = (saved: Pick<SavedQuery, 'query' | 'source'>): string =>
  saved.query?.entity ?? savedQuerySources(saved.source)[0] ?? '';

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

const toStoredTimeBound = (
  restore: SavedQueryTimeRestore,
  field: string,
  periodRange: (period: string) => TimeRange,
): QueryTimeBound | null => {
  if (restore.action === SavedQueryTimeAction.ApplyPeriod && restore.period) {
    return { field, range: periodRange(restore.period), period: restore.period };
  }
  if (restore.action === SavedQueryTimeAction.ApplyRange && restore.range) {
    return { field, range: restore.range };
  }
  return null;
};

export const withStoredTimeBound = (input: StoredTimeBoundInput): StructuredQuery | undefined => {
  const { saved, fields, functions, knownPeriods, periodRange } = input;
  const { query } = saved;
  const field = findTimestampField(fields);
  if (!query || !field) return query;

  const bound = toStoredTimeBound(toTimeRestore(saved.time, knownPeriods), field, periodRange);
  return bound ? { ...query, filter: withTimeBound(query.filter ?? null, bound, functions) } : query;
};

export const toBuilderRestore = (input: SavedQueryRestoreInput): SavedQueryRestore => {
  const { saved, fields, functions, knownPeriods, translatedSql } = input;
  const entityName = savedQueryPrimarySource(saved);

  const editor = deriveSavedQueryEditor(saved, functions, fields);
  const isBuilder = editor === SavedQueryEditor.Builder;
  const state =
    saved.query && isBuilder
      ? parseQuery(saved.query, fields, functions)
      : { ...createInitialState(functions), entityName, fields };
  const sql = saved.sql ?? (isBuilder ? '' : (translatedSql ?? ''));

  return {
    editor,
    state,
    sqlText: sql ? formatSql(sql) : '',
    unloadedQuery: !isBuilder && !sql ? saved.query : void 0,
    time: toTimeRestore(saved.time, knownPeriods),
    resultView: saved.result_view ?? QueryResultView.Table,
    chartConfig: saved.chart
      ? {
          type: saved.chart.type,
          xField: saved.chart.x_field,
          yFields: readChartYFields(saved.chart.y_field),
          legend: readChartLegend(saved.chart.legend),
        }
      : void 0,
  };
};
