import { useCallback, useState } from 'react';

import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TimeFilterValue, TimeRange } from '@/src/models/time-range';
import { isRangeIncludingToday, isTimeRange } from '@/src/utils/time-filter/time-range';
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

  // Auto-refresh only makes sense when the range includes "now":
  // - preset mode (sliding window always includes now)
  // - custom mode with endDate >= today
  const canAutoRefresh = !isCustom || isRangeIncludingToday(timeRange);

  return {
    timePeriod,
    timeRange,
    isCustom,
    canAutoRefresh,
    getCurrentTimeRange,
    onTimePeriodChange,
    onTimeRangeChange,
  };
}
