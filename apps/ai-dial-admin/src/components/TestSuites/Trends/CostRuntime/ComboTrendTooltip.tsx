'use client';

import classNames from 'classnames';
import { FC } from 'react';
import { IconExternalLink } from '@tabler/icons-react';

import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { comboTrendTotal } from '@/src/components/TestSuites/Trends/CostRuntime/utils/fold-combo-points';
import { TREND_TOOLTIP_TEXT_ACCENT } from '@/src/components/TestSuites/Trends/utils/chart-tooltip-styles';
import { formatMetricTrendTooltipDate } from '@/src/components/TestSuites/Trends/utils/format';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface RowProps {
  label: string;
  value: string;
  swatchClass?: string;
  emphasize?: boolean;
}

const TooltipRow: FC<RowProps> = ({ label, value, swatchClass, emphasize }) => (
  <div className="flex w-full items-center justify-between gap-3">
    <span className="flex min-w-0 items-center gap-1">
      {swatchClass != null && (
        <span className={classNames('size-2 shrink-0 rounded-[2px] border border-primary', swatchClass)} aria-hidden />
      )}
      <span className={classNames('dial-tiny-text whitespace-nowrap', emphasize && 'dial-tiny-semi-text')}>
        {label}
      </span>
    </span>
    <span className="dial-tiny-semi-text tabular-nums">{value}</span>
  </div>
);

interface Props {
  point: ComboTrendPoint;
  sourceLabel: string;
  metricsLabel: string;
  totalLabel: string;
  sourceSwatchClass: string;
  metricsSwatchClass: string;
  formatValue: (value: number | null) => string;
}

const ComboTrendTooltip: FC<Props> = ({
  point,
  sourceLabel,
  metricsLabel,
  totalLabel,
  sourceSwatchClass,
  metricsSwatchClass,
  formatValue,
}) => {
  const total = comboTrendTotal(point);
  const href = getUrnForEntity(ApplicationRoute.Runs, { id: point.runId, testRunName: point.runName });

  return (
    <div className="flex min-w-[160px] flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="dial-tiny-semi-text flex items-center gap-1 no-underline"
          style={{ color: TREND_TOOLTIP_TEXT_ACCENT }}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="whitespace-nowrap">{point.runName}</span>
          <IconExternalLink {...BASE_BUTTON_ICON_PROPS} width={16} height={16} aria-hidden />
        </a>
        <span className="dial-tiny-semi-text whitespace-nowrap tabular-nums">
          {formatMetricTrendTooltipDate(point.computedAtMs)}
        </span>
      </div>
      <TooltipRow label={totalLabel} value={formatValue(total)} emphasize />
      <TooltipRow label={sourceLabel} value={formatValue(point.source)} swatchClass={sourceSwatchClass} />
      <TooltipRow label={metricsLabel} value={formatValue(point.metrics)} swatchClass={metricsSwatchClass} />
    </div>
  );
};

export default ComboTrendTooltip;
