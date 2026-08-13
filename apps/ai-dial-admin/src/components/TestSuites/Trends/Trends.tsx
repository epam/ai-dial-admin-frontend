'use client';

import { FC } from 'react';

import {
  DialLoader,
  DialNeutralButton,
  DialNotification,
  ElementSize,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';

import KpiStrip from '@/src/components/TestSuites/Trends/KpiStrip';
import MetricTrends from '@/src/components/TestSuites/Trends/MetricTrends';
import OverallScoreTrend from '@/src/components/TestSuites/Trends/OverallScoreTrend';
import { useTrendsData } from '@/src/components/TestSuites/Trends/use-trends-data';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite: TestSuite;
  onStartRun?: () => void;
}

const Trends: FC<Props> = ({ selectedTestSuite, onStartRun }) => {
  const t = useI18n();
  const { data, isLoading } = useTrendsData(selectedTestSuite.id);
  const isEmpty = !data || data.kpis.runCount === 0;

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <DialLoader size={40} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-4">
        <DialNotification
          variant={NotificationVariant.Info}
          iconSize={20}
          title={t(TestSuitesI18nKey.TrendsNoRunsTitle)}
          message={
            <div className="flex flex-col items-start gap-2">
              <span>{t(TestSuitesI18nKey.TrendsNoRunsDescription)}</span>
              {onStartRun && (
                <DialNeutralButton
                  size={ElementSize.Small}
                  className="w-fit"
                  label={t(ButtonsI18nKey.Run)}
                  iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  onClick={onStartRun}
                  disabled={selectedTestSuite.valid === false}
                />
              )}
            </div>
          }
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-4">
      {data.kpis.runCount === 1 && (
        <DialNotification
          variant={NotificationVariant.Info}
          iconSize={20}
          message={t(TestSuitesI18nKey.TrendsSingleRunMessage)}
          role="status"
        />
      )}
      <KpiStrip kpis={data.kpis} />
      <OverallScoreTrend runOrder={data.runOrder} runCount={data.kpis.runCount} isLoading={isLoading} />
      <MetricTrends
        runOrder={data.runOrder}
        runCount={data.kpis.runCount}
        statistics={data.statistics}
        byStatistic={data.byStatistic}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Trends;
