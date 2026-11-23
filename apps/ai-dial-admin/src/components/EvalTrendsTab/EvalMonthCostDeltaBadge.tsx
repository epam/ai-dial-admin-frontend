'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  deltaLabel: string;
  className?: string;
}

const CARET_PROPS = { size: 12, stroke: 1.5, 'aria-hidden': true as const };

/** MoM cost chip: red + caret-up when spend rose, green + caret-down when it fell. */
const EvalMonthCostDeltaBadge: FC<Props> = ({ deltaLabel, className }) => {
  const t = useI18n();
  const isIncrease = deltaLabel.startsWith('+');
  const badgeLabel = t(TestSuitesI18nKey.EvalTrendsDeltaVsPrevPeriod, { delta: deltaLabel });
  const Caret = isIncrease ? IconCaretUpFilled : IconCaretDownFilled;

  return (
    <Badge
      label={badgeLabel}
      variant={BadgeVariant.Filled}
      color={isIncrease ? BadgeColor.Red : BadgeColor.Green}
      icon={<Caret {...CARET_PROPS} />}
      textClassName="dial-tiny-semi-text"
      className={classNames('shrink-0', className)}
    />
  );
};

export default EvalMonthCostDeltaBadge;
