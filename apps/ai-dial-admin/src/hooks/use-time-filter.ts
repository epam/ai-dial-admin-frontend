import { useCallback, useState } from 'react';

import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TimeFilterValue, TimeRange, isTimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';

interface UseTimeFilterOptions {
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

export function useTimeFilter({ defaultTimeFilter, onTimeFilterChange }: UseTimeFilterOptions = {}) {
  const initIsCustom = isTimeRange(defaultTimeFilter);
  const initPresetId = initIsCustom ? DEFAULT_TIME_PERIOD : defaultTimeFilter || DEFAULT_TIME_PERIOD;

  const [timePeriod, setTimePeriod] = useState(initPresetId);
  const [timeRange, setTimeRange] = useState<TimeRange>(() =>
    initIsCustom ? defaultTimeFilter : getTimeRangeById(initPresetId),
  );
  const [isCustom, setIsCustom] = useState(initIsCustom);

  const getCurrentTimeRange = useCallback(
    () => (isCustom ? timeRange : getTimeRangeById(timePeriod || DEFAULT_TIME_PERIOD)),
    [isCustom, timeRange, timePeriod],
  );

  const onTimePeriodChange = useCallback(
    (period: string) => {
      setTimePeriod(period);
      setIsCustom(false);
      onTimeFilterChange?.(period);
      setTimeRange(getTimeRangeById(period));
    },
    [onTimeFilterChange],
  );

  const onTimeRangeChange = useCallback(
    (range: TimeRange, custom?: boolean) => {
      setTimeRange(range);
      if (custom) {
        setIsCustom(true);
        onTimeFilterChange?.(range);
      }
    },
    [onTimeFilterChange],
  );

  return {
    timePeriod,
    timeRange,
    isCustom,
    getCurrentTimeRange,
    onTimePeriodChange,
    onTimeRangeChange,
  };
}
