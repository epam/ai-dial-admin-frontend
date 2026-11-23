'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  deltaLabel: string;
  /** Whether a rise is the favourable direction (a count of suites run) rather than the costly one (spend). */
  isIncreaseGood?: boolean;
  className?: string;
}

const CARET_PROPS = { size: 12, stroke: 1.5, 'aria-hidden': true as const };

/**
 * "vs prev. period" chip with a caret for the direction. By default a rise is red and a fall green, as for
 * cost; `isIncreaseGood` flips the colours for a figure where more is better.
 */
const EvalMonthCostDeltaBadge: FC<Props> = ({ deltaLabel, isIncreaseGood = false, className }) => {
  const t = useI18n();
  const isIncrease = deltaLabel.startsWith('+');
  const isFavourable = isIncrease === isIncreaseGood;
  const badgeLabel = t(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod, { delta: deltaLabel });
  const Caret = isIncrease ? IconCaretUpFilled : IconCaretDownFilled;

  return (
    <Badge
      label={badgeLabel}
      variant={BadgeVariant.Filled}
      color={isFavourable ? BadgeColor.Green : BadgeColor.Red}
      icon={<Caret {...CARET_PROPS} />}
      textClassName="dial-tiny-semi-text"
      className={classNames('shrink-0', className)}
    />
  );
};

export default EvalMonthCostDeltaBadge;
