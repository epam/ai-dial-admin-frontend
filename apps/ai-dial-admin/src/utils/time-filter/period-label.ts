import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { TimeRange } from '@/src/models/time-range';

// Zero-padded and locale-ordered, matching how the time-filter control renders a custom range.
export const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

// The label for the period a figure covers, spelled as the time-filter control spells it — the preset's
// own display label, not its raw id, so a pill and the control beside it cannot read differently.
// `timePeriod` holds the last preset chosen and is not cleared when a custom range is applied, so reading
// it alone would caption a custom range with a stale preset.
export const timePeriodLabel = (timePeriod: string, timeRange: TimeRange, isCustom: boolean): string => {
  if (isCustom) {
    return `${formatDate(timeRange.startDate)} - ${formatDate(timeRange.endDate)}`;
  }

  return timePeriodOptionsConfig.find((option) => option.value === timePeriod)?.label ?? timePeriod;
};
