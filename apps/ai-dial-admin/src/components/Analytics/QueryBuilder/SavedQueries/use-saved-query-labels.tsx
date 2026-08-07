'use client';

import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryChart, SavedQueryTime, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface SavedQueryLabels {
  periodLabel: (time?: SavedQueryTime) => string;
  showsAsLabel: (view: QueryResultView, chart?: SavedQueryChart) => string;
}

export const useSavedQueryLabels = (): SavedQueryLabels => {
  const t = useI18n();

  const periodLabel = (time?: SavedQueryTime): string => {
    if (!time) return t(QueryBuilderI18nKey.SavedQueryPeriodNotSaved);
    if (time.mode === SavedQueryTimeMode.Relative) {
      // A token this deployment does not offer still names the author's intent, so it is shown as
      // stored rather than hidden or replaced.
      const option = timePeriodOptionsConfig.find((o) => o.value === time.period);
      return t(QueryBuilderI18nKey.SavedQueryPeriodRelative, { period: option?.label ?? time.period });
    }
    return t(QueryBuilderI18nKey.SavedQueryPeriodAbsolute, {
      from: formatDateTimeToLocalString(time.from),
      to: formatDateTimeToLocalString(time.to),
    });
  };

  const showsAsLabel = (view: QueryResultView, chart?: SavedQueryChart): string => {
    if (view !== QueryResultView.Chart) return t(QueryBuilderI18nKey.ViewTable);
    const type = chart?.type ?? ChartType.Bar;
    return t(QueryBuilderI18nKey.SavedQueryShowsAsChart, { type });
  };

  return { periodLabel, showsAsLabel };
};
