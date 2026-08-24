'use client';

import { FC, useMemo } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import ReactECharts from 'echarts-for-react';

import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { useStickyChartTooltip } from '@/src/components/TestSuites/Trends/use-sticky-chart-tooltip';
import { buildOverallScoreChartOptions } from '@/src/components/TestSuites/Trends/utils/chart-options';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  runOrder: TrendsRunPoint[];
  runCount: number;
  isLoading?: boolean;
}

const OverallScoreTrend: FC<Props> = ({ runOrder, runCount, isLoading }) => {
  const t = useI18n();
  const hasData = runOrder.some((point) => point.overallScore != null);
  const chartRef = useStickyChartTooltip(hasData && !isLoading);

  const options = useMemo(
    () =>
      buildOverallScoreChartOptions(runOrder, {
        date: t(TestSuitesI18nKey.TrendsTooltipDate),
        run: t(TestSuitesI18nKey.TrendsTooltipRun),
        score: t(TestSuitesI18nKey.TrendsTooltipScore),
      }),
    [runOrder, t],
  );

  return (
    <SummarySection
      isFillHeight={false}
      title={
        <>
          {t(TestSuitesI18nKey.OverallScoreTrend)}{' '}
          <span className="font-normal text-secondary">
            · {t(TestSuitesI18nKey.TrendsRunsCount, { count: runCount })}
          </span>
        </>
      }
    >
      {isLoading ? (
        <div className="flex h-[220px] items-center justify-center">
          <DialLoader size={32} />
        </div>
      ) : !hasData ? (
        <DialNoDataContent title={t(BasicI18nKey.NoData)} />
      ) : (
        <ReactECharts ref={chartRef} option={options} className="h-[220px] w-full" opts={{ renderer: 'canvas' }} />
      )}
    </SummarySection>
  );
};

export default OverallScoreTrend;
