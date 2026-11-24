'use client';

import { FC } from 'react';

import { Skeleton, SkeletonVariant } from '@epam/ai-dial-ui-kit';

import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const SKELETON_HEIGHT = 320;

/** Holds the place of the Test Suite Health Distribution chart, which does not exist yet; it carries no data. */
const HealthDistributionPlaceholder: FC = () => {
  const t = useI18n();

  return (
    <SummarySection title={t(EvalSystemHealthI18nKey.HealthDistribution)} isFillHeight={false}>
      <div aria-hidden>
        <Skeleton
          variant={SkeletonVariant.Rectangular}
          width="100%"
          height={SKELETON_HEIGHT}
          paragraph={false}
          showTitle={false}
        />
      </div>
    </SummarySection>
  );
};

export default HealthDistributionPlaceholder;
