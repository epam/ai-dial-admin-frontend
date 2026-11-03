import { findTimestampField, withTimeBound } from '@/src/components/Analytics/QueryBuilder/utils/time';
import { WidgetQuery, WidgetQueryKind } from '@/src/models/analytics/dashboard';
import { QueryPageType } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';

/**
 * The request one widget runs. A structured query is bound to the dashboard range on its entity's first
 * temporal field — the field the query page bounds — and capped at the widget's row limit; a stored time
 * bound never reaches here, since saved bodies are stored without one. Composite SQL runs as written.
 * Null for an unavailable or failed query, which has nothing to run.
 */
export const buildWidgetRunRequest = (
  widgetQuery: WidgetQuery,
  rowLimit: number,
  range: TimeRange,
  period?: string,
): QueryRunRequest | null => {
  if (widgetQuery.kind === WidgetQueryKind.Unavailable || widgetQuery.kind === WidgetQueryKind.Failed) return null;
  if (widgetQuery.kind === WidgetQueryKind.CompositeSql) {
    return { kind: QueryRequestKind.Sql, sql: widgetQuery.sql };
  }

  const { query, fields } = widgetQuery;
  const field = findTimestampField(fields);
  return {
    kind: QueryRequestKind.Structured,
    query: {
      ...query,
      filter: field ? withTimeBound(query.filter ?? null, { field, range, period }) : query.filter,
      page: { type: QueryPageType.Offset, offset: 0, limit: rowLimit, include_total: false },
    },
  };
};
