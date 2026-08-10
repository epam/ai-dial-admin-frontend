import { isBuilderRepresentable, parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SavedQuery,
  SavedQueryCaptureInput,
  SavedQueryEditor,
  SavedQueryRequest,
  SavedQueryRestore,
  SavedQueryRestoreInput,
  SavedQueryTime,
  SavedQueryTimeAction,
  SavedQueryTimeMode,
  SavedQueryTimeRestore,
} from '@/src/models/analytics/saved-query';

// Which editor a saved query opens in, from its body alone. The same derivation labels the row in the
// library and picks the view on load, so the chip a user reads before clicking cannot disagree with
// what they get. Nothing about the editor is stored — a persisted value could contradict its query.
export const deriveSavedQueryEditor = (saved: Pick<SavedQuery, 'sql' | 'query'>): SavedQueryEditor => {
  if (saved.sql?.trim()) return SavedQueryEditor.Sql;
  if (saved.query && isBuilderRepresentable(saved.query)) return SavedQueryEditor.Builder;
  return SavedQueryEditor.Json;
};

// The entity whose schema must be resolved before a saved query can be hydrated. A SQL body has no
// structured entity, so its server-derived `source` is the only name available.
export const savedQueryEntityName = (saved: SavedQuery): string => saved.query?.entity ?? saved.source ?? '';

const toSavedQueryTime = (input: SavedQueryCaptureInput): SavedQueryTime | undefined => {
  if (!input.captureTime) return undefined;
  if (!input.isCustom) return { mode: SavedQueryTimeMode.Relative, period: input.timePeriod };

  // The service rejects an inverted absolute range outright, and an inverted range means nothing
  // anyway — order the pair so a save can never fail on a detail the user cannot see or correct.
  const { startDate, endDate } = input.timeRange;
  const [from, to] = startDate.getTime() <= endDate.getTime() ? [startDate, endDate] : [endDate, startDate];
  return { mode: SavedQueryTimeMode.Absolute, from: from.toISOString(), to: to.toISOString() };
};

// Builder state and toolbar intent to the nine fields a create or replace accepts. Everything arrives
// by value: no clock is read and no state is resolved here, so the same inputs always produce the same
// body — which is what lets the caller compare two of these to decide whether anything has changed.
export const toSavedQueryRequest = (input: SavedQueryCaptureInput): SavedQueryRequest => {
  const request: SavedQueryRequest = {
    name: input.name.trim(),
    scope: input.scope,
    result_view: input.resultView,
  };

  const description = input.description.trim();
  if (description) request.description = description;

  const tag = input.tag.trim();
  if (tag) request.tag = tag;

  // Exactly one body. A blank SQL string counts as absent on the service's side too, so trimming here
  // keeps the two in step rather than sending a body the storage constraint would then reject.
  const sql = input.sqlText?.trim();
  if (sql) {
    request.sql = sql;
  } else {
    // Built WITHOUT the toolbar time bound: `buildQuery(state, bound)` injects the range as a ge/le
    // pair on the timestamp column, which would freeze a relative period into two instants and pin the
    // saved query to the day it was authored. The bound is re-materialized at run time instead.
    request.query = buildQuery(input.state, null);
  }

  const time = toSavedQueryTime(input);
  if (time) request.time = time;

  // Only a charted query carries a chart, and an axis the user never picked stays null so it re-derives
  // against whatever columns the query returns on open. That null is meaningful, so unlike every other
  // absent member it is sent rather than omitted.
  if (input.resultView === QueryResultView.Chart) {
    request.chart = {
      type: input.chartConfig.type,
      x_field: input.chartConfig.xField,
      y_field: input.chartConfig.yField,
    };
  }

  return request;
};

const toTimeRestore = (time: SavedQueryTime | undefined, knownPeriods: string[]): SavedQueryTimeRestore => {
  if (!time) return { action: SavedQueryTimeAction.Leave };

  if (time.mode === SavedQueryTimeMode.Relative) {
    // A period this deployment does not offer — saved elsewhere, or since narrowed away — is not
    // something the reader can act on, and substituting a default would misreport the query's intent.
    return knownPeriods.includes(time.period)
      ? { action: SavedQueryTimeAction.ApplyPeriod, period: time.period }
      : { action: SavedQueryTimeAction.Leave };
  }

  const startDate = new Date(time.from);
  const endDate = new Date(time.to);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { action: SavedQueryTimeAction.Leave };
  return { action: SavedQueryTimeAction.ApplyRange, range: { startDate, endDate } };
};

// A stored saved query back into everything the builder needs to show it. Catalog data is not read
// from the saved query — `fields` is the caller's own resolved schema, so a query resolves against the
// reader's view of the entity rather than the author's.
export const toBuilderRestore = (input: SavedQueryRestoreInput): SavedQueryRestore => {
  const { saved, fields, functions, knownPeriods } = input;

  const state = saved.query
    ? parseQuery(saved.query, fields, functions)
    : { ...createInitialState(functions), entityName: savedQueryEntityName(saved), fields };

  return {
    editor: deriveSavedQueryEditor(saved),
    state,
    sqlText: saved.sql ?? '',
    jsonText: saved.query ? JSON.stringify(saved.query, null, 2) : '',
    time: toTimeRestore(saved.time, knownPeriods),
    resultView: saved.result_view ?? QueryResultView.Table,
    chartConfig: saved.chart
      ? { type: saved.chart.type, xField: saved.chart.x_field, yField: saved.chart.y_field }
      : undefined,
  };
};
