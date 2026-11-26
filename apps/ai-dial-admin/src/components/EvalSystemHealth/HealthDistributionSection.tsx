'use client';

import { FC, useState } from 'react';

import {
  Button,
  NoDataContent,
  Notification,
  NotificationType,
  NotificationVariant,
  Spinner,
} from '@epam/ai-dial-ui-kit';

import HealthDistributionChart from '@/src/components/EvalSystemHealth/HealthDistributionChart';
import HealthDistributionControls from '@/src/components/EvalSystemHealth/HealthDistributionControls';
import HealthDistributionInfoTooltip from '@/src/components/EvalSystemHealth/HealthDistributionInfoTooltip';
import HealthDistributionLegend from '@/src/components/EvalSystemHealth/HealthDistributionLegend';
import HealthDistributionTable from '@/src/components/EvalSystemHealth/HealthDistributionTable';
import { HEALTH_DISTRIBUTION_THRESHOLD, HEALTH_DISTRIBUTION_WEEKS } from '@/src/components/EvalSystemHealth/constants';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useHealthDistributionData } from '@/src/components/EvalSystemHealth/use-health-distribution-data';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const DEFAULT_THRESHOLD_PERCENT = Math.round(HEALTH_DISTRIBUTION_THRESHOLD * 100);

const HealthDistributionSection: FC = () => {
  const t = useI18n();
  const [weeks, setWeeks] = useState(HEALTH_DISTRIBUTION_WEEKS);
  const [thresholdPercent, setThresholdPercent] = useState(DEFAULT_THRESHOLD_PERCENT);
  const { status, bars, threshold, isEmpty, retry } = useHealthDistributionData(weeks, thresholdPercent / 100);
  const title = t(EvalSystemHealthI18nKey.HealthDistribution, { count: weeks });

  const reset = () => {
    setWeeks(HEALTH_DISTRIBUTION_WEEKS);
    setThresholdPercent(DEFAULT_THRESHOLD_PERCENT);
  };

  let content;
  if (status === CoverageStatus.Loading) {
    content = <Spinner size={32} fullWidth />;
  } else if (status === CoverageStatus.Error) {
    content = (
      <div className="flex flex-col items-start gap-2">
        <Notification
          variant={NotificationVariant.Error}
          type={NotificationType.SectionMessage}
          iconSize={20}
          message={t(EvalSystemHealthI18nKey.HealthDistributionLoadFailed)}
          role="alert"
        />
        <Button label={t(EvalSystemHealthI18nKey.HealthDistributionRetry)} onClick={retry} />
      </div>
    );
  } else if (isEmpty) {
    content = (
      <NoDataContent
        title={t(EvalSystemHealthI18nKey.HealthDistributionEmptyTitle)}
        description={t(EvalSystemHealthI18nKey.HealthDistributionEmptyDescription)}
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-3">
        <HealthDistributionLegend threshold={threshold} />
        <HealthDistributionChart bars={bars} />
        <HealthDistributionTable bars={bars} label={title} />
      </div>
    );
  }

  return (
    <SummarySection
      title={title}
      titleSuffix={<HealthDistributionInfoTooltip threshold={threshold} />}
      control={
        <HealthDistributionControls
          weeks={weeks}
          thresholdPercent={thresholdPercent}
          isModified={weeks !== HEALTH_DISTRIBUTION_WEEKS || thresholdPercent !== DEFAULT_THRESHOLD_PERCENT}
          onWeeksChange={setWeeks}
          onThresholdPercentChange={setThresholdPercent}
          onReset={reset}
        />
      }
    >
      {content}
    </SummarySection>
  );
};

export default HealthDistributionSection;
