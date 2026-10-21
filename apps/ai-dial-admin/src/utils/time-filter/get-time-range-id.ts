import { TimeRange } from '@/src/models/time-range';
import {
  TimeFilterOption,
  isAnchoredTimePeriodOption,
  timePeriodOptionsConfig,
} from '@/src/constants/global-time-filter';

export const getTimeRangeById = (
  periodId: string,
  options: TimeFilterOption[] = timePeriodOptionsConfig,
): TimeRange => {
  const now = new Date();
  const option = options.find((item) => item.value === periodId);

  if (option && isAnchoredTimePeriodOption(option)) {
    return { startDate: new Date(option.startDate), endDate: now };
  }

  const startDate = new Date(now.getTime() - (option?.offset ?? 0));

  return { startDate, endDate: now };
};
