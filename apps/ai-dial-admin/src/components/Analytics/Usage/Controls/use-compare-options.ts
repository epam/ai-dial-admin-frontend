import { useMemo } from 'react';

import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** The compare choices, in the order every Compare picker lists them. */
export const useCompareOptions = () => {
  const t = useI18n();
  return useMemo(
    () => [
      { value: ComparePeriod.Off, label: t(AnalyticsUsageI18nKey.CompareOff) },
      { value: ComparePeriod.PreviousPeriod, label: t(AnalyticsUsageI18nKey.ComparePreviousPeriod) },
      { value: ComparePeriod.PreviousMonth, label: t(AnalyticsUsageI18nKey.ComparePreviousMonth) },
      { value: ComparePeriod.PreviousYear, label: t(AnalyticsUsageI18nKey.ComparePreviousYear) },
    ],
    [t],
  );
};
