'use client';

import { FC, useCallback, useId, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import UsageControls from '@/src/components/Analytics/Usage/Controls/UsageControls';
import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import UsageBlock from '@/src/components/Analytics/Usage/UsageBlock';
import { useAnalyticsAccess } from '@/src/components/Analytics/Usage/use-analytics-access';
import { useLoadFailureNotice } from '@/src/components/Analytics/Usage/use-load-failure-notice';
import { useUsageWindows } from '@/src/components/Analytics/Usage/use-usage-windows';
import { getBlockTabs, getEntityBlocks } from '@/src/components/Analytics/Usage/utils/entity-blocks';
import { buildEntityScope, getEntityDeploymentName } from '@/src/components/Analytics/Usage/utils/entity-scope';
import { VIEW_LABEL_KEY } from '@/src/components/Analytics/Usage/utils/labels';
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

/** One entity's usage: a block per kind of traffic it has, under one period and comparison. */
const EntityUsageDashboard: FC<Props> = ({ route, entity, defaultTimeFilter, onTimeFilterChange }) => {
  const t = useI18n();
  const isForbidden = useAnalyticsAccess();

  const [compare, setCompare] = useState<ComparePeriod>(ComparePeriod.PreviousPeriod);
  const [refreshToken, setRefreshToken] = useState(0);
  const [refreshingViews, setRefreshingViews] = useState<Set<UsageView>>(() => new Set());

  const timeFilter = useTimeFilter({ defaultTimeFilter, onTimeFilterChange });
  const { windows, resolution } = useUsageWindows({ ...timeFilter, compare, refreshToken });

  // One notice for every block: an outage that reaches all of them is still one thing that went wrong.
  const notice = useLoadFailureNotice(t(AnalyticsUsageI18nKey.LoadFailed));

  const blocks = useMemo(() => getEntityBlocks(route), [route]);
  const blockTabs = useMemo(() => blocks.map(getBlockTabs), [blocks]);
  // Keyed on the name, not the entity object: a re-fetched entity is a new object with the same
  // rows, and a new scope would re-issue every block's reads.
  const deploymentName = getEntityDeploymentName(route, entity);
  const scope = useMemo(() => buildEntityScope(route, deploymentName), [route, deploymentName]);
  const headingId = useId();

  const onRefresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  /** One handler per view, stable across renders, so a block's effect does not re-run on each one. */
  const onRefreshingChange = useMemo(
    () =>
      Object.fromEntries(
        blocks.map(({ view }) => [
          view,
          (isRefreshing: boolean) =>
            setRefreshingViews((current) => {
              if (current.has(view) === isRefreshing) return current;
              const next = new Set(current);
              if (isRefreshing) next.add(view);
              else next.delete(view);
              return next;
            }),
        ]),
      ) as Record<UsageView, (isRefreshing: boolean) => void>,
    [blocks],
  );

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

  if (!scope) {
    return null;
  }

  return (
    // The widgets scroll inside this panel, so the cards keep a gutter the scrollbar can sit in
    // instead of being drawn over their right edge.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto px-3">
      <UsageControls
        compare={compare}
        onCompareChange={setCompare}
        timePeriod={timeFilter.timePeriod}
        onTimePeriodChange={timeFilter.onTimePeriodChange}
        timeRange={timeFilter.timeRange}
        onTimeRangeChange={timeFilter.onTimeRangeChange}
        isRefreshing={refreshingViews.size > 0}
        onRefresh={onRefresh}
      />

      {blocks.map((block, index) => (
        <section key={block.view} className="flex flex-col gap-5" aria-labelledby={`${headingId}-${block.view}`}>
          <h2 id={`${headingId}-${block.view}`}>{t(VIEW_LABEL_KEY[block.view])}</h2>
          <UsageBlock
            view={block.view}
            scope={scope}
            tabs={blockTabs[index]}
            windows={windows}
            resolution={resolution}
            compare={compare}
            refreshToken={refreshToken}
            notice={notice}
            onRefreshingChange={onRefreshingChange[block.view]}
          />
        </section>
      ))}
    </div>
  );
};

export default EntityUsageDashboard;
