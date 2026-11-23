'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';

import { PassRateTrend } from '@/src/components/EvalTrendsTab/suite-pass-rate';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  trend: PassRateTrend;
  className?: string;
}

const CARET_PROPS = { size: 12, stroke: 1.5, 'aria-hidden': true as const };

/** Pass-rate trend chip: green + caret-up when the mean rose, red + caret-down when it fell. */
const EvalPassRateTrendBadge: FC<Props> = ({ trend, className }) => {
  const t = useI18n();
  const isUp = trend === 'up';
  const badgeLabel = t(isUp ? TestSuitesI18nKey.EvalTrendsTrendingUp : TestSuitesI18nKey.EvalTrendsTrendingDown);
  const Caret = isUp ? IconCaretUpFilled : IconCaretDownFilled;

  return (
    <Badge
      label={badgeLabel}
      variant={BadgeVariant.Filled}
      color={isUp ? BadgeColor.Green : BadgeColor.Red}
      icon={<Caret {...CARET_PROPS} />}
      textClassName="dial-tiny-semi-text"
      className={classNames('shrink-0', className)}
    />
  );
};

export default EvalPassRateTrendBadge;
