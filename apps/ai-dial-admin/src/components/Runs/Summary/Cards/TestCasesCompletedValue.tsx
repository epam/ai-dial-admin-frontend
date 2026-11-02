'use client';

import { FC, ReactNode } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { IconCheck, IconX } from '@tabler/icons-react';
import classNames from 'classnames';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import { CompletionBreakdown } from '@/src/components/Runs/Summary/models';
import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { NO_DATA_VALUE } from './constants';

const ICON_SIZE = 12;

interface RowProps {
  label: string;
  count: number;
  icon?: ReactNode;
  isNested?: boolean;
  isStrong?: boolean;
}

const TooltipRow: FC<RowProps> = ({ label, count, icon, isNested, isStrong }) => (
  <div className={classNames('flex items-center justify-between gap-6', { 'pl-4': isNested })}>
    <span className="flex items-center gap-1">
      {icon}
      <span className={classNames({ 'dial-small-semi': isStrong })}>{label}</span>
    </span>
    <span className={classNames({ 'dial-small-semi': isStrong || !isNested })}>{count}</span>
  </div>
);

interface Props {
  breakdown: CompletionBreakdown;
  hasThreshold: boolean;
  /** Run name shown as the tooltip's first line, used in compare mode where two runs share a card. */
  tooltipTitle?: string;
}

const TestCasesCompletedValue: FC<Props> = ({ breakdown, hasThreshold, tooltipTitle }) => {
  const t = useI18n();

  if (breakdown.total === 0) {
    return <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>;
  }

  const tooltip = (
    <div className="flex flex-col gap-1 dial-small-text">
      {tooltipTitle && <span>{tooltipTitle}</span>}
      <TooltipRow label={t(TestSuitesI18nKey.TrendsTotalTestCases)} count={breakdown.total} isStrong />
      <TooltipRow
        label={t(TestSuitesI18nKey.TrendsTestCasesCompleted)}
        count={breakdown.completed}
        icon={<IconCheck size={ICON_SIZE} className="text-accent-secondary" aria-hidden />}
      />
      {hasThreshold && (
        <>
          <TooltipRow
            label={t(TestSuitesI18nKey.TrendsScoreAboveThreshold)}
            count={breakdown.above}
            icon={<ChevronBadge isPositive size={ICON_SIZE} />}
            isNested
          />
          <TooltipRow
            label={t(TestSuitesI18nKey.TrendsScoreBelowThreshold)}
            count={breakdown.below}
            icon={<ChevronBadge isPositive={false} size={ICON_SIZE} />}
            isNested
          />
        </>
      )}
      <TooltipRow
        label={t(TestSuitesI18nKey.TrendsTestCasesErrorOrNa)}
        count={breakdown.errorOrNa}
        icon={<IconX size={ICON_SIZE} className="text-error" aria-hidden />}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <Tooltip tooltip={tooltip} asChild>
        <button type="button" className="flex w-fit cursor-default items-baseline gap-1">
          <span className="dial-display2-text text-primary">{breakdown.completed}</span>
          <span className="dial-body-text text-secondary">/{breakdown.total}</span>
        </button>
      </Tooltip>
      {breakdown.errorOrNa > 0 && (
        <span className="flex items-center gap-1 dial-small-text text-secondary">
          <IconX size={ICON_SIZE} className="text-error" aria-hidden />
          <span className="text-primary">{breakdown.errorOrNa}</span>
          <span>{t(ErrorI18nKey.Error)}</span>
        </span>
      )}
    </div>
  );
};

export default TestCasesCompletedValue;
