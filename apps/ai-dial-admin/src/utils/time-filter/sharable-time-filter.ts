import { DEFAULT_TIME_PERIOD, timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { TimeFilterValue } from '@/src/models/time-range';
import { isTimeRange } from '@/src/utils/time-filter/time-range';

// A period id only one surface's option list can resolve must not travel to a sibling tab.
export const getSharableTimeFilter = (value: TimeFilterValue): TimeFilterValue => {
  if (isTimeRange(value)) {
    return value;
  }

  const isSharedPreset = timePeriodOptionsConfig.some((option) => option.value === value);

  return isSharedPreset ? value : DEFAULT_TIME_PERIOD;
};
