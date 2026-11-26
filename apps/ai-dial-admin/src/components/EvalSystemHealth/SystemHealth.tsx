'use client';

import { FC } from 'react';

import ActivityCardRow from '@/src/components/EvalSystemHealth/ActivityCardRow';
import CoverageCard from '@/src/components/EvalSystemHealth/CoverageCard';
import CoverageCardRow from '@/src/components/EvalSystemHealth/CoverageCardRow';
import HealthDistributionSection from '@/src/components/EvalSystemHealth/HealthDistributionSection';
import RunTrendsSection from '@/src/components/EvalSystemHealth/RunTrendsSection';
import { CoverageKind } from '@/src/components/EvalSystemHealth/models';
import { useCoverageData } from '@/src/components/EvalSystemHealth/use-coverage-data';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const SystemHealth: FC = () => {
  const t = useI18n();
  const coverageCards = useCoverageData();
  const evaluateesCard = coverageCards.find((card) => card.kind === CoverageKind.Evaluatees);
  const kindCards = coverageCards.filter((card) => card.kind !== CoverageKind.Evaluatees);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto">
      <h1 className="dial-h1-text">{t(MenuI18nKey.SystemHealth)}</h1>
      <div className="flex flex-col gap-4">
        <ActivityCardRow>{evaluateesCard && <CoverageCard card={evaluateesCard} />}</ActivityCardRow>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CoverageCardRow cards={kindCards} />
          <HealthDistributionSection />
        </div>
        <RunTrendsSection />
      </div>
    </div>
  );
};

export default SystemHealth;
