import { useEffect, useRef, useState } from 'react';

import { executeQuery } from '@/src/app/[lang]/queries/actions';
import {
  buildSparklineQuery,
  getSparklineUnit,
  toSparklinePoints,
} from '@/src/components/Analytics/CustomDashboards/utils/sparkline';
import { StructuredQuery } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';

interface Options {
  query: StructuredQuery | null;
  timeField: string | null;
  column: string;
  range: TimeRange;
  isEnabled: boolean;
  refreshToken?: number;
}

/**
 * The trend under a single value: the same structured query over the same range, bucketed by time. A separate
 * run, so a slow trend never holds up the figure; a query with a group-by, no time field or a failed run draws
 * no line.
 */
export const useQuerySparkline = ({
  query,
  timeField,
  column,
  range,
  isEnabled,
  refreshToken = 0,
}: Options): number[] => {
  const [points, setPoints] = useState<number[]>([]);
  const runIdRef = useRef(0);
  const rangeKey = `${range.startDate.getTime()}-${range.endDate.getTime()}`;

  useEffect(() => {
    if (!isEnabled || !column || !query || !timeField || query.group_by?.length) {
      runIdRef.current += 1;
      setPoints([]);
      return;
    }

    const runId = ++runIdRef.current;
    const run = async () => {
      try {
        const res = await executeQuery(buildSparklineQuery(query, timeField, getSparklineUnit(range)));
        if (runId !== runIdRef.current) return;
        setPoints(res.success && res.response ? toSparklinePoints(res.response.rows, column) : []);
      } catch {
        if (runId === runIdRef.current) setPoints([]);
      }
    };
    void run();
    // `range` reaches the effect through `rangeKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeField, column, rangeKey, isEnabled, refreshToken]);

  return points;
};
