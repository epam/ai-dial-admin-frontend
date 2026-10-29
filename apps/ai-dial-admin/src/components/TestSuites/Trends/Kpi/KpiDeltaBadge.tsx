'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { Badge, BadgeColor, BadgeVariant, Tooltip } from '@epam/ai-dial-ui-kit';

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
  const badgeLabel = t(TestSuitesI18nKey.TrendsDeltaVsPrev, { delta: label });

  return (
    <Tooltip tooltip={badgeLabel} triggerClassName="min-w-0 max-w-full">
      <Badge
        label={badgeLabel}
        variant={BadgeVariant.Filled}
        color={isPositive ? BadgeColor.Green : BadgeColor.Red}
        textClassName="dial-tiny-semi-text max-w-full truncate"
        className={classNames('min-w-0 max-w-full', className)}
      />
    </Tooltip>
  );
};

export default KpiDeltaBadge;
