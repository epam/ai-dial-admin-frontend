'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ACCURACY_THRESHOLDS } from './constants';
import { getAccuracyHeatCellStyleFromThreshold } from './utils';

export enum ColorScaleVariant {
  Default = 'default',
  Compact = 'compact',
}

interface Props {
  variant?: ColorScaleVariant;
}

const COMPACT_SEGMENT_WIDTH = 52;
const COMPACT_BAR_WIDTH = COMPACT_SEGMENT_WIDTH * ACCURACY_THRESHOLDS.length;

const ColorScale: FC<Props> = ({ variant = ColorScaleVariant.Default }) => {
  const t = useI18n();
  const isCompact = variant === ColorScaleVariant.Compact;

  return (
    <div
      className={classNames('inline-flex flex-col gap-0.5', isCompact ? 'w-[520px]' : 'w-[700px]')}
      data-variant={variant}
    >
      {!isCompact && (
        <div className="flex justify-between text-sm text-secondary">
          <span>{t(BasicI18nKey.LowAccuracy)}</span>
          <span>{t(BasicI18nKey.HighAccuracy)}</span>
        </div>
      )}

      <div className="flex">
        {ACCURACY_THRESHOLDS.map((threshold) => (
          <div
            key={threshold}
            className={classNames(isCompact ? 'h-2' : 'h-2', isCompact ? `w-[${COMPACT_SEGMENT_WIDTH}px]` : 'w-[70px]')}
            style={{
              width: isCompact ? COMPACT_SEGMENT_WIDTH : 70,
              ...getAccuracyHeatCellStyleFromThreshold(threshold),
            }}
          />
        ))}
      </div>

      <div className="flex" style={isCompact ? { width: COMPACT_BAR_WIDTH } : undefined}>
        {ACCURACY_THRESHOLDS.map((threshold, index) =>
          index === 0 ? (
            <span
              key={threshold}
              className={classNames(
                'text-secondary flex justify-between',
                isCompact ? 'dial-tiny-text flex-1' : 'w-[70px] text-sm',
              )}
            >
              <span className={isCompact ? 'text-primary' : undefined}>0</span>
              <span>{threshold.toFixed(1)}</span>
            </span>
          ) : (
            <span
              key={threshold}
              className={classNames(
                'text-right text-secondary',
                isCompact ? 'dial-tiny-text flex-1' : 'w-[70px] text-sm',
                index === ACCURACY_THRESHOLDS.length - 1 && isCompact ? 'text-primary' : undefined,
              )}
            >
              {index === ACCURACY_THRESHOLDS.length - 1 ? '1' : threshold.toFixed(1)}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

export default ColorScale;
