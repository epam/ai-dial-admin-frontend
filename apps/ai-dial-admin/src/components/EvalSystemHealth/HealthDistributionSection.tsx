'use client';

import { FC } from 'react';

import {
  Button,
  NoDataContent,
  Notification,
  NotificationType,
  NotificationVariant,
  Spinner,
} from '@epam/ai-dial-ui-kit';

import HealthDistributionChart from '@/src/components/EvalSystemHealth/HealthDistributionChart';
import HealthDistributionInfoTooltip from '@/src/components/EvalSystemHealth/HealthDistributionInfoTooltip';
import HealthDistributionLegend from '@/src/components/EvalSystemHealth/HealthDistributionLegend';
import HealthDistributionTable from '@/src/components/EvalSystemHealth/HealthDistributionTable';
import { HEALTH_DISTRIBUTION_WEEKS } from '@/src/components/EvalSystemHealth/constants';
import { CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { useHealthDistributionData } from '@/src/components/EvalSystemHealth/use-health-distribution-data';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const HealthDistributionSection: FC = () => {
  const t = useI18n();
  const { status, bars, threshold, isEmpty, retry } = useHealthDistributionData();
  const title = t(EvalSystemHealthI18nKey.HealthDistribution, { count: HEALTH_DISTRIBUTION_WEEKS });

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
      isFillHeight={false}
    >
      {content}
    </SummarySection>
  );
};

export default HealthDistributionSection;
