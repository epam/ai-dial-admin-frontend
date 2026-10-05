'use client';

import { FC, useCallback, useState } from 'react';

import UsageControls from '@/src/components/Analytics/Usage/Controls/UsageControls';
import { PAGE_SCOPE, VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import UsageBlock from '@/src/components/Analytics/Usage/UsageBlock';
import { useLoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { useUsageWindows } from '@/src/components/Analytics/Usage/use-usage-windows';
import { AnalyticsUsageI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';

/** The standalone Dashboards page: one block, whichever view `View by` names. */
const UsageDashboard: FC = () => {
  const t = useI18n();

  const [view, setView] = useState<UsageView>(UsageView.Llm);
  const [compare, setCompare] = useState<ComparePeriod>(ComparePeriod.PreviousPeriod);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeFilter = useTimeFilter();
  const { windows, resolution } = useUsageWindows({ ...timeFilter, compare, refreshToken });

  // One notice for the page: a failure that reaches both hooks is still one thing that went wrong.
  const notice = useLoadFailureNotice(t(AnalyticsUsageI18nKey.LoadFailed));

  const onRefresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  return (
    // The widgets scroll inside this panel, so the cards keep a gutter the scrollbar can sit in
    // instead of being drawn over their right edge.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto px-3">
      <h1>{t(MenuI18nKey.Dashboard)}</h1>

      <UsageControls
        view={view}
        onViewChange={setView}
        compare={compare}
        onCompareChange={setCompare}
        timePeriod={timeFilter.timePeriod}
        onTimePeriodChange={timeFilter.onTimePeriodChange}
        timeRange={timeFilter.timeRange}
        onTimeRangeChange={timeFilter.onTimeRangeChange}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      <UsageBlock
        view={view}
        scope={PAGE_SCOPE}
        tabs={VIEW_BREAKDOWN_TABS[view]}
        windows={windows}
        resolution={resolution}
        compare={compare}
        refreshToken={refreshToken}
        notice={notice}
        onRefreshingChange={setIsRefreshing}
      />
    </div>
  );
};

export default UsageDashboard;
