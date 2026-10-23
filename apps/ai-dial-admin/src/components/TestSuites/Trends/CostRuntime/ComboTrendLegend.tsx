'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface SwatchProps {
  swatchClass: string;
  label: string;
}

const SquareLegendItem: FC<SwatchProps> = ({ swatchClass, label }) => (
  <span className="flex items-center gap-1">
    <span className={classNames('size-2 shrink-0 rounded-[2px]', swatchClass)} aria-hidden />
    <span className="dial-tiny-text text-secondary whitespace-nowrap">{label}</span>
  </span>
);

interface LineLegendProps {
  color: string;
  label: string;
}

const LineLegendItem: FC<LineLegendProps> = ({ color, label }) => (
  <span className="flex items-center gap-1">
    <span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: color }} />
      <span className="relative size-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
    <span className="dial-tiny-text text-secondary whitespace-nowrap">{label}</span>
  </span>
);

interface Props {
  sourceLabel: string;
  metricsLabel: string;
  totalLabel: string;
  sourceSwatchClass: string;
  metricsSwatchClass: string;
  lineColor: string;
}

const ComboTrendLegend: FC<Props> = ({
  sourceLabel,
  metricsLabel,
  totalLabel,
  sourceSwatchClass,
  metricsSwatchClass,
  lineColor,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <SquareLegendItem swatchClass={sourceSwatchClass} label={sourceLabel} />
    <SquareLegendItem swatchClass={metricsSwatchClass} label={metricsLabel} />
    <LineLegendItem color={lineColor} label={totalLabel} />
  </div>
);

export default ComboTrendLegend;
