'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { useI18n } from '@/src/locales/client';
import { ACCURACY_COLOR_MAP, ACCURACY_THRESHOLDS } from './constants';

const ColorLine: FC = () => {
  const t = useI18n();
  return (
    <div className={classNames('inline-flex w-[700px] flex-col gap-0.5')}>
      <div className="flex justify-between text-sm text-secondary">
        <span>{t('Basic.LowAccuracy')}</span>
        <span>{t('Basic.HighAccuracy')}</span>
      </div>

      <div className="flex">
        {ACCURACY_THRESHOLDS.map((threshold) => {
          const color = ACCURACY_COLOR_MAP[threshold];

          return (
            <div
              key={threshold}
              className="h-2 w-[70px]"
              style={{
                backgroundColor: color.bg,
                borderBottomRightRadius: '2px',
                borderColor: color.border,
                borderRight: `2px solid ${color.border}`,
                borderBottom: `2px solid ${color.border}`,
              }}
            />
          );
        })}
      </div>

      <div className="flex">
        {ACCURACY_THRESHOLDS.map((threshold, index) =>
          index === 0 ? (
            <span key={threshold} className="w-[70px] text-sm text-secondary flex justify-between">
              <span>0</span>
              <span>{threshold.toFixed(1)}</span>
            </span>
          ) : (
            <span key={threshold} className="w-[70px] text-right text-sm text-secondary">
              {threshold.toFixed(1)}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

export default ColorLine;
