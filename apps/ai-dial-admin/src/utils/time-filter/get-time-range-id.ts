import { TimeRange } from '@/src/models/time-range';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';

export const getTimeRangeById = (periodId: string): TimeRange => {
  const config = timePeriodOptionsConfig.find((item) => item.id === periodId);
  const now = new Date();
  const startDate = new Date(now.getTime() - (config?.offset ?? 0));

  return { startDate: startDate, endDate: now };
};
