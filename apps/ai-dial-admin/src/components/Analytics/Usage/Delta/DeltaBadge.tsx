'use client';

import { FC } from 'react';

import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import { Badge } from '@epam/ai-dial-ui-kit';

import { KpiMetric } from '@/src/components/Analytics/Usage/models';
import { getDeltaBadgeAppearance } from '@/src/components/Analytics/Usage/utils/delta-tone';
import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  ratio: number;
  metric: KpiMetric;
}

const ARROW_SIZE = 14;
const ARROW_STROKE = 2;

const DeltaBadge: FC<Props> = ({ ratio, metric }) => {
  const t = useI18n();

  const magnitude = formatPercent(Math.abs(ratio));
  const isRise = ratio > 0;
  const Arrow = isRise ? IconArrowUp : IconArrowDown;
  const spoken =
    ratio === 0
      ? magnitude
      : t(isRise ? AnalyticsUsageI18nKey.KpiDeltaIncrease : AnalyticsUsageI18nKey.KpiDeltaDecrease, {
          value: magnitude,
        });

  return (
    <>
      <Badge
        aria-hidden
        label={magnitude}
        icon={ratio !== 0 ? <Arrow size={ARROW_SIZE} stroke={ARROW_STROKE} aria-hidden /> : void 0}
        textClassName="dial-tiny-semi-text"
        className="min-w-20 justify-center"
        {...getDeltaBadgeAppearance(metric, ratio)}
      />
      <span className="sr-only">{spoken}</span>
    </>
  );
};

export default DeltaBadge;
