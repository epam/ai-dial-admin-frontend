import { useCallback, useEffect, useRef, useState } from 'react';

import { executeQuery, executeSqlQuery } from '@/src/app/[lang]/queries/actions';
import { buildExecutedMeta, resolveGroupByColumns } from '@/src/components/Analytics/QueryBuilder/utils/executed-meta';
import { WIDGET_DENIED_STATUSES } from '@/src/constants/analytics/dashboards';
import { WidgetQuery, WidgetQueryKind } from '@/src/models/analytics/dashboard';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { ExecutedQueryMeta, QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';
import { buildWidgetRunRequest } from '@/src/utils/analytics/dashboard-widget-query';

interface Options {
  // Undefined while the widget's saved query is still being resolved.
  widgetQuery?: WidgetQuery;
  rowLimit: number;
  range: TimeRange;
  period?: string;
  // The compared window, for a view that draws one; the compared run never takes a preset period.
  previousRange?: TimeRange;
}

interface WidgetData {
  result: StructuredQueryResult | null;
  meta: ExecutedQueryMeta | null;
  // The compared window's rows; null without a compared run, or when only that run failed.
  previousResult: StructuredQueryResult | null;
  isLoading: boolean;
  hasFailed: boolean;
  // The query cannot be read, or the service refused its data to this viewer: nothing may be shown or retried.
  isDenied: boolean;
  onRetry: () => void;
}

/**
 * A structured run names its group-by columns by the field they group on, while the rows carry the alias a
 * translated SQL query gave them (`client_type AS client`); the rows decide, as they do for a SQL run.
 */
const withAliasedGroupBy = (
  meta: ExecutedQueryMeta,
  request: QueryRunRequest,
  response: StructuredQueryResult,
): ExecutedQueryMeta => {
  if (request.kind !== QueryRequestKind.Structured || !response.rows.length) return meta;
  const columns = Object.keys(response.rows[0]);
  const dimensionColumns = resolveGroupByColumns(request.query, columns);
  return {
    ...meta,
    dimensionColumns,
    aggregateColumns: columns.filter((column) => !dimensionColumns.includes(column)),
  };
};

/**
 * Runs one widget on its own, so a slow or failing widget never holds up the others. Composite SQL takes
 * neither the range nor the row limit, so a range change does not re-run it.
 */
export const useDashboardWidgetData = ({
  widgetQuery,
  rowLimit,
  range,
  period,
  previousRange,
}: Options): WidgetData => {
  const [result, setResult] = useState<StructuredQueryResult | null>(null);
  const [previousResult, setPreviousResult] = useState<StructuredQueryResult | null>(null);
  const [meta, setMeta] = useState<ExecutedQueryMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);
  const [isRefused, setIsRefused] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  // Only the latest run may write its answer: an earlier one can land after a later range change.
  const runIdRef = useRef(0);

  const isComposite = widgetQuery?.kind === WidgetQueryKind.CompositeSql;
  const previousKey = previousRange ? `${previousRange.startDate.getTime()}-${previousRange.endDate.getTime()}` : '';
  const rangeKey = isComposite
    ? ''
    : `${range.startDate.getTime()}-${range.endDate.getTime()}-${rowLimit}-${previousKey}`;

  useEffect(() => {
    // Taken before any early return, so a run still in flight cannot write over a query that has nothing to run.
    const runId = ++runIdRef.current;
    if (!widgetQuery) return;

    const request = buildWidgetRunRequest(widgetQuery, rowLimit, range, period);
    if (!request) {
      setIsLoading(false);
      setHasFailed(true);
      return;
    }

    const previousRequest =
      previousRange && request.kind === QueryRequestKind.Structured
        ? buildWidgetRunRequest(widgetQuery, rowLimit, previousRange)
        : null;

    setIsLoading(true);
    setHasFailed(false);
    setIsRefused(false);

    const run = async () => {
      try {
        const [res, previousRes] = await Promise.all([
          request.kind === QueryRequestKind.Sql ? executeSqlQuery(request.sql) : executeQuery(request.query),
          previousRequest?.kind === QueryRequestKind.Structured ? executeQuery(previousRequest.query) : null,
        ]);
        if (runId !== runIdRef.current) return;
        if (!res.success || !res.response) {
          setHasFailed(true);
          setIsRefused(res.status != null && WIDGET_DENIED_STATUSES.includes(res.status));
          return;
        }
        const fields = widgetQuery.kind === WidgetQueryKind.Structured ? widgetQuery.fields : [];
        const entity = request.kind === QueryRequestKind.Structured ? request.query.entity : '';
        setResult(res.response);
        setPreviousResult(previousRes?.success ? (previousRes.response ?? null) : null);
        setMeta(withAliasedGroupBy(buildExecutedMeta(request, res.response, fields, entity), request, res.response));
      } catch {
        if (runId === runIdRef.current) setHasFailed(true);
      } finally {
        if (runId === runIdRef.current) setIsLoading(false);
      }
    };
    void run();
    // `range`, `rowLimit` and `previousRange` reach the effect through `rangeKey`, which composite SQL keeps
    // constant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetQuery, rangeKey, retryToken]);

  const onRetry = useCallback(() => setRetryToken((token) => token + 1), []);

  const isDenied = widgetQuery?.kind === WidgetQueryKind.Unavailable || isRefused;

  return { result, meta, previousResult, isLoading, hasFailed, isDenied, onRetry };
};
