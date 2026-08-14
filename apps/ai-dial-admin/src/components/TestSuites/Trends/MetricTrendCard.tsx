'use client';

import classNames from 'classnames';
import { FC, useMemo, useState } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import ReactECharts from 'echarts-for-react';

import { TREND_TAG_BG_COLORS } from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendGroup, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { buildMetricTrendChartOptions } from '@/src/components/TestSuites/Trends/utils/chart-options';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  group: MetricTrendGroup;
  runOrder: TrendsRunPoint[];
}

const MetricTrendCard: FC<Props> = ({ group, runOrder }) => {
  const t = useI18n();
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());

  const options = useMemo(
    () => buildMetricTrendChartOptions(runOrder, group.series, hiddenSeries, t(TestSuitesI18nKey.TrendsTooltipRun)),
    [group.series, hiddenSeries, runOrder, t],
  );

  const onToggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-secondary bg-layer-2 p-4">
      <p className="dial-small-text text-primary">{group.name}</p>
      <div className="flex flex-wrap gap-1">
        {group.series.map((series, index) => {
          const hidden = hiddenSeries.has(series.name);
          return (
            <button
              key={series.name}
              type="button"
              onClick={() => onToggleSeries(series.name)}
              className={classNames(
                'flex h-6 max-w-[116px] items-center gap-1 rounded-lg border px-2 dial-tiny-text font-semibold text-primary',
                hidden && 'opacity-40',
              )}
              style={{
                borderColor: series.color,
                backgroundColor: TREND_TAG_BG_COLORS[index % TREND_TAG_BG_COLORS.length],
              }}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />
              <DialEllipsisTooltip text={series.name} className="min-w-0" />
            </button>
          );
        })}
      </div>
      <div className="h-[111px] overflow-hidden rounded border border-secondary bg-layer-2">
        <ReactECharts option={options} className="h-full w-full" opts={{ renderer: 'canvas' }} notMerge />
      </div>
    </div>
  );
};

export default MetricTrendCard;
