'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';

interface Props {
  name: string;
  value: number | null;
  isError: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const MetricCard: FC<Props> = ({ name, value, isError, isSelected, onClick }) => {
  const formattedValue = value != null ? value.toFixed(3) : '\u2014';
  const fillWidth = value != null ? Math.min(value * 100, 100) : 0;

  return (
    <div
      className={classNames(
        'flex-1 min-w-[72px] rounded border p-2 text-center transition-colors',
        isError
          ? 'border-error bg-error'
          : isSelected
            ? 'border-accent-primary bg-accent-primary-alpha'
            : 'border-secondary bg-layer-0 hover:border-hover',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div
        className={classNames('dial-tiny-text mb-1 break-all leading-tight', isError ? 'text-error' : 'text-secondary')}
      >
        {name}
      </div>
      <div className={classNames('dial-small-semi-text', isError ? 'text-error' : 'text-primary')}>
        {formattedValue}
      </div>
      <div className="h-[3px] bg-layer-4 rounded-sm mt-1.5 overflow-hidden">
        <div
          className={classNames('h-full rounded-sm transition-[width] duration-400', isError && 'bg-error')}
          style={{
            width: `${fillWidth}%`,
            ...(!isError && value != null ? { backgroundColor: getAccuracyColors(value).bg } : {}),
          }}
        />
      </div>
    </div>
  );
};

export default MetricCard;
