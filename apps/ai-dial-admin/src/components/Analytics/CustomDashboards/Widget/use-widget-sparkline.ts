import { useEffect, useRef, useState } from 'react';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import {
  buildSparklineQuery,
  getSparklineUnit,
  toSparklinePoints,
} from '@/src/components/Analytics/CustomDashboards/utils/sparkline';
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
}

/**
 * The trend under a Single value card, as the usage dashboard draws one: the same query over the same range,
 * bucketed by time. A separate run, so a slow trend never holds up the figure; a failed one draws no line.
 */
export const useWidgetSparkline = ({ widgetQuery, column, range, period, isEnabled }: Options): number[] => {
  const [points, setPoints] = useState<number[]>([]);
  const runIdRef = useRef(0);
  const rangeKey = `${range.startDate.getTime()}-${range.endDate.getTime()}`;

  useEffect(() => {
    if (!isEnabled || !column || widgetQuery?.kind !== WidgetQueryKind.Structured) {
      setPoints([]);
      return;
    }
    const timeField = findTimestampField(widgetQuery.fields);
    const request = buildWidgetRunRequest(widgetQuery, MAX_WIDGET_ROWS, range, period);
    if (!timeField || request?.kind !== QueryRequestKind.Structured || request.query.group_by?.length) {
      setPoints([]);
      return;
    }

    const runId = ++runIdRef.current;
    const run = async () => {
      try {
        const res = await executeQuery(buildSparklineQuery(request.query, timeField, getSparklineUnit(range)));
        if (runId !== runIdRef.current) return;
        setPoints(res.success && res.response ? toSparklinePoints(res.response.rows, column) : []);
      } catch {
        if (runId === runIdRef.current) setPoints([]);
      }
    };
    void run();
    // `range` reaches the effect through `rangeKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetQuery, column, rangeKey, period, isEnabled]);

  return points;
};
