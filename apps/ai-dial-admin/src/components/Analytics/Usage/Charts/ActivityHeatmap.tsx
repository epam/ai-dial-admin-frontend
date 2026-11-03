'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { GhostButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import DashboardCard from '@/src/components/Analytics/Usage/Card/DashboardCard';
import HeatmapWeekGrid, { formatHeatmapDayLabel } from '@/src/components/Analytics/Usage/Charts/HeatmapWeekGrid';
import { HeatmapMetric, UsageView } from '@/src/components/Analytics/Usage/models';
import { HeatmapWeek } from '@/src/components/Analytics/Usage/use-heatmap-week';
import { formatGroupedMoney, formatGroupedNumber } from '@/src/components/Analytics/Usage/utils/format';
import { buildHeatmapMatrix } from '@/src/components/Analytics/Usage/utils/heatmap';
import { formatWeekLabel } from '@/src/components/Analytics/Usage/utils/weeks';
import { isPricedView } from '@/src/components/Analytics/Usage/utils/views';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  heatmap: HeatmapWeek;
  /** An MCP row carries no price, so there is nothing to paint in that view. */
  view: UsageView;
  /** Overrides the view's own answer; absent, a priced view offers cost. */
  isCostOffered?: boolean;
}

const PAGER_ICON_PROPS = { size: 16, stroke: 2 };

const ActivityHeatmap: FC<Props> = ({ heatmap, view, isCostOffered: isCostOfferedOverride }) => {
  const t = useI18n();
  // Cost first wherever it is offered; where it is not, `activeMetric` below reads calls.
  const [metric, setMetric] = useState<HeatmapMetric>(HeatmapMetric.Cost);
  const { buckets, week, weekOffset, onPreviousWeek, onNextWeek, onCurrentWeek } = heatmap;

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const isCostOffered = isCostOfferedOverride ?? isPricedView(view);
  const activeMetric = isCostOffered ? metric : HeatmapMetric.Calls;

  const matrix = useMemo(
    () => buildHeatmapMatrix(buckets.data ?? [], week, formatHeatmapDayLabel, activeMetric),
    [buckets.data, week, activeMetric],
  );

  const metricTabs = useMemo(
    () => [
      { id: HeatmapMetric.Cost, label: t(AnalyticsUsageI18nKey.HeatmapMetricCost) },
      { id: HeatmapMetric.Calls, label: t(AnalyticsUsageI18nKey.HeatmapMetricCalls) },
    ],
    [t],
  );

  const readCellLabel = useCallback(
    (day: string, hour: string, value: number) =>
      activeMetric === HeatmapMetric.Cost
        ? t(AnalyticsUsageI18nKey.HeatmapCellCostLabel, { day, hour, cost: formatGroupedMoney(value) })
        : t(AnalyticsUsageI18nKey.HeatmapCellLabel, { day, hour, calls: formatGroupedNumber(value) }),
    [activeMetric, t],
  );

  // The grid always draws its seven days, so an empty week is stated in the subtitle rather than by
  // replacing the grid with a message.
  const isEmptyWeek = !buckets.isLoading && (buckets.hasFailed || matrix.maxValue === 0);

  return (
    <DashboardCard
      title={t(AnalyticsUsageI18nKey.HeatmapTitle)}
      subtitle={
        isEmptyWeek
          ? t(AnalyticsUsageI18nKey.HeatmapEmptySubtitle, { timezone })
          : t(AnalyticsUsageI18nKey.HeatmapSubtitle, { timezone })
      }
      headerActions={
        <div className="flex items-center gap-3">
          {/* Beside the pager: both control what the grid shows, one the week and one the figure. */}
          {isCostOffered && (
            <TabSelector tabs={metricTabs} activeTab={metric} onChange={(next) => setMetric(next as HeatmapMetric)} />
          )}
          {/* Rendered only when it does something. The group is pinned to the header's right edge,
              so the button appears to its left without moving the pager under the cursor — the
              reserved gap it used to sit in read as a control that had gone missing. */}
          {weekOffset !== 0 && (
            <GhostButton
              size={ElementSize.Small}
              label={t(AnalyticsUsageI18nKey.HeatmapCurrentWeek)}
              onClick={onCurrentWeek}
            />
          )}
          <GhostButton
            size={ElementSize.Small}
            className="px-1"
            iconBefore={<IconChevronLeft {...PAGER_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapPreviousWeek)}
            onClick={onPreviousWeek}
          />
          <span className="dial-tiny-text min-w-[84px] whitespace-nowrap text-center text-primary">
            {formatWeekLabel(week)}
          </span>
          <GhostButton
            size={ElementSize.Small}
            className="px-1"
            iconBefore={<IconChevronRight {...PAGER_ICON_PROPS} aria-hidden />}
            title={t(AnalyticsUsageI18nKey.HeatmapNextWeek)}
            disabled={weekOffset === 0}
            onClick={onNextWeek}
          />
        </div>
      }
    >
      <HeatmapWeekGrid matrix={matrix} isLoading={buckets.isLoading} readCellLabel={readCellLabel} />
    </DashboardCard>
  );
};

export default ActivityHeatmap;
