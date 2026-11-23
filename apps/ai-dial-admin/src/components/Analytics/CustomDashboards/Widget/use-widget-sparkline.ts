import { useMemo } from 'react';

import { useQuerySparkline } from '@/src/components/Analytics/Common/use-query-sparkline';
import { findTimestampField } from '@/src/components/Analytics/QueryBuilder/utils/time';
import { MAX_WIDGET_ROWS } from '@/src/constants/analytics/dashboards';
import { WidgetQuery, WidgetQueryKind } from '@/src/models/analytics/dashboard';
import { QueryRequestKind } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';
import { buildWidgetRunRequest } from '@/src/utils/analytics/dashboard-widget-query';

interface Options {
  widgetQuery?: WidgetQuery;
  column: string;
  range: TimeRange;
  period?: string;
  isEnabled: boolean;
  refreshToken?: number;
}

/**
 * The trend under a Single value card, as the usage dashboard draws one: the widget's own run request,
 * handed to the shared query sparkline.
 */
export const useWidgetSparkline = ({
  widgetQuery,
  column,
  range,
  period,
  isEnabled,
  refreshToken = 0,
}: Options): number[] => {
  const rangeKey = `${range.startDate.getTime()}-${range.endDate.getTime()}`;
  const { query, timeField } = useMemo(() => {
    if (widgetQuery?.kind !== WidgetQueryKind.Structured) return { query: null, timeField: null };
    const request = buildWidgetRunRequest(widgetQuery, MAX_WIDGET_ROWS, range, period);
    return {
      query: request?.kind === QueryRequestKind.Structured ? request.query : null,
      timeField: findTimestampField(widgetQuery.fields) ?? null,
    };
    // `range` reaches the memo through `rangeKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetQuery, rangeKey, period]);

  return useQuerySparkline({ query, timeField, column, range, isEnabled, refreshToken });
};
