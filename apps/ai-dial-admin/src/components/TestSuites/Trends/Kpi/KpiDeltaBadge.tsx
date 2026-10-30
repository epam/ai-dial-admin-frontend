'use client';

import { FC, useEffect, useRef, useState } from 'react';

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
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    // Relies on Badge rendering a .truncate span internally; revisit if ui-kit Badge internals change
    const badgeText = badgeRef.current?.querySelector<HTMLElement>('.truncate');
    if (!badgeText) return;

    const measureOverflow = () => setIsOverflowing(badgeText.scrollWidth > badgeText.clientWidth);
    measureOverflow();

    const observer = new ResizeObserver(measureOverflow);
    observer.observe(badgeText);
    return () => observer.disconnect();
  }, [badgeLabel]);

  return (
    <Tooltip tooltip={badgeLabel} hideTooltip={!isOverflowing} triggerClassName="min-w-0 max-w-full">
      <span ref={badgeRef} className="contents">
        <Badge
          label={badgeLabel}
          variant={BadgeVariant.Filled}
          color={isPositive ? BadgeColor.Green : BadgeColor.Red}
          textClassName="dial-tiny-semi-text max-w-full truncate"
          className={classNames('min-w-0 max-w-full', className)}
        />
      </span>
    </Tooltip>
  );
};

export default KpiDeltaBadge;
