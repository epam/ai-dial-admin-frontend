'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { getAccuracyColors } from '@/src/components/Common/ColorScale/utils';
import { useTheme } from '@/src/context/ThemeContext';

interface Props {
  name: string;
  value: number | null;
  isError: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const MetricCard: FC<Props> = ({ name, value, isError, isSelected, onClick }) => {
  const { currentTheme } = useTheme();
  const formattedValue = value != null ? value.toFixed(3) : '\u2014';
  const fillWidth = value != null ? Math.min(value * 100, 100) : 0;
  const isClickable = !!onClick;

  let stateClasses = 'border-secondary bg-layer-0';
  if (isError) {
    stateClasses = 'border-error bg-error';
  } else if (isSelected) {
    stateClasses = 'border-accent-primary bg-accent-primary-alpha';
  } else if (isClickable) {
    stateClasses = 'border-secondary bg-layer-0 hover:border-hover focus-visible:border-hover';
  }

  return (
    <div
      className={classNames(
        'flex-1 min-w-[72px] rounded border p-2 text-center transition-colors',
        stateClasses,
        isClickable && 'cursor-pointer',
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
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
            ...(!isError && value != null ? { backgroundColor: getAccuracyColors(value, currentTheme).bg } : {}),
          }}
        />
      </div>
    </div>
  );
};

export default MetricCard;
