'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import PassRateBar from '@/src/components/Common/PassRateBar/PassRateBar';
import { formatPassRatePercent } from '@/src/components/Common/PassRateBar/utils';
import CoverageInfoTooltip from '@/src/components/EvalSystemHealth/CoverageInfoTooltip';
import { COVERAGE_KIND_TITLE_KEY } from '@/src/components/EvalSystemHealth/constants';
import { CoverageCardModel, CoverageKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  card: CoverageCardModel;
  className?: string;
}

const CoverageCard: FC<Props> = ({ card, className }) => {
  const t = useI18n();
  const { kind, status, total, uncovered, rate } = card;
  const title = t(COVERAGE_KIND_TITLE_KEY[kind]);

  let content;
  if (status === CoverageStatus.Error) {
    content = (
      <Notification
        variant={NotificationVariant.Error}
        type={NotificationType.SectionMessage}
        iconSize={20}
        message={t(EvalSystemHealthI18nKey.CoverageLoadFailed)}
        role="alert"
      />
    );
  } else if (status === CoverageStatus.Loading) {
    content = <Spinner size={24} />;
  } else {
    content = (
      <div className="flex flex-col gap-1">
        <p className="dial-display2-text text-primary">{rate == null ? '—' : formatPassRatePercent(rate)}</p>
        {rate != null && <PassRateBar rate={rate} label={title} />}
        <p className="dial-small-text text-secondary">
          {t(EvalSystemHealthI18nKey.CoverageCaption, { total, uncovered })}
        </p>
      </div>
    );
  }

  return (
    <KpiCardFrame
      className={className}
      ariaLabel={title}
      title={title}
      titleSuffix={kind === CoverageKind.Evaluatees ? <CoverageInfoTooltip /> : undefined}
    >
      {content}
    </KpiCardFrame>
  );
};

export default CoverageCard;
