'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  label: string;
  higherIsBetter: boolean;
  className?: string;
}

/** “vs prev.” pill for Trends KPI cards (Figma success/error chips). */
const KpiDeltaBadge: FC<Props> = ({ label, higherIsBetter, className }) => {
  const t = useI18n();
  const isIncrease = label.startsWith('+');
  const isPositive = higherIsBetter ? isIncrease : !isIncrease;

  return (
    <Badge
      label={t(TestSuitesI18nKey.TrendsDeltaVsPrev, { delta: label })}
      variant={BadgeVariant.Filled}
      color={isPositive ? BadgeColor.Green : BadgeColor.Red}
      textClassName="dial-tiny-semi-text"
      className={className}
    />
  );
};

export default KpiDeltaBadge;
