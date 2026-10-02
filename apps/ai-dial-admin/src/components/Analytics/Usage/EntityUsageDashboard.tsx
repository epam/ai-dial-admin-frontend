'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import UsageControls from '@/src/components/Analytics/Usage/Controls/UsageControls';
import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import UsageBlock from '@/src/components/Analytics/Usage/UsageBlock';
import { useAnalyticsAccess } from '@/src/components/Analytics/Usage/use-analytics-access';
import { useLoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { useUsageWindows } from '@/src/components/Analytics/Usage/use-usage-windows';
import { getBlockTabs, getEntityBlocks, hasDeclaredRoutes } from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { buildEntityScope, getEntityDeploymentName } from '@/src/components/Analytics/Usage/utils/entity-scope';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { TimeFilterValue } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  route: ApplicationRoute;
  entity: BaseEntity;
  /** The period the entity's Audit tabs share, so switching tabs keeps it. */
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

/** One entity's usage: the page's widgets, with `View by` offering only the views the entity has. */
const EntityUsageDashboard: FC<Props> = ({ route, entity, defaultTimeFilter, onTimeFilterChange }) => {
  const t = useI18n();
  const isForbidden = useAnalyticsAccess();

  const [compare, setCompare] = useState<ComparePeriod>(ComparePeriod.PreviousPeriod);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeFilter = useTimeFilter({ defaultTimeFilter, onTimeFilterChange });
  const { windows, resolution } = useUsageWindows({ ...timeFilter, compare, refreshToken });

  // One notice for every block: an outage that reaches all of them is still one thing that went wrong.
  const notice = useLoadFailureNotice(t(AnalyticsUsageI18nKey.LoadFailed));

  // Keyed on whether the entity declares routes, not on the entity object, for the same reason the
  // scope is keyed on its name.
  const isDeclaringRoutes = hasDeclaredRoutes(entity as { routes?: unknown });
  const blocks = useMemo(() => getEntityBlocks(route, isDeclaringRoutes), [route, isDeclaringRoutes]);
  const views = useMemo(() => blocks.map((block) => block.view), [blocks]);
  // Keyed on the name, not the entity object: a re-fetched entity is a new object with the same
  // rows, and a new scope would re-issue every block's reads.
  const deploymentName = getEntityDeploymentName(route, entity);
  const scope = useMemo(() => buildEntityScope(route, deploymentName), [route, deploymentName]);

  // The first block is the default; a view the entity no longer has (its routes were removed) falls
  // back to it rather than to an empty dashboard.
  const [selectedView, setSelectedView] = useState<UsageView | null>(null);
  const block = blocks.find(({ view }) => view === selectedView) ?? blocks[0];
  const blockTabs = useMemo(() => (block ? getBlockTabs(block) : []), [block]);

  const onRefresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  if (isForbidden == null) {
    return (
      <div className="flex size-full items-center justify-center">
        <DialLoader />
      </div>
    );
  }

  if (isForbidden) {
    return <Page403 />;
  }

  if (!scope || !block) {
    return null;
  }

  return (
    // The widgets scroll inside this panel, so the cards keep a gutter the scrollbar can sit in
    // instead of being drawn over their right edge.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto px-3">
      <UsageControls
        view={block.view}
        views={views}
        onViewChange={setSelectedView}
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
        view={block.view}
        reads={block}
        scope={scope}
        tabs={blockTabs}
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

export default EntityUsageDashboard;
