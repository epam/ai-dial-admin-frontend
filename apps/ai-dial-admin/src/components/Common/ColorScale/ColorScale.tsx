'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ABSOLUTE_SCORE_BUCKET_KEYS, DELTA_SCORE_BUCKET_KEYS } from '@/src/components/Common/ScoreCell/constants';
import { getScoreCellBucketClasses } from '@/src/components/Common/ScoreCell/utils';

export enum ColorScaleVariant {
  Default = 'default',
  Compact = 'compact',
  Delta = 'delta',
}

interface Props {
  variant?: ColorScaleVariant;
}

const COMPACT_SEGMENT_WIDTH = 52;
const DEFAULT_SEGMENT_WIDTH = 70;
const COMPACT_BAR_WIDTH = COMPACT_SEGMENT_WIDTH * ABSOLUTE_SCORE_BUCKET_KEYS.length;
const DELTA_SEGMENT_COUNT = DELTA_SCORE_BUCKET_KEYS.length + 1; // +1 for the neutral gap at 0
const DELTA_BAR_WIDTH = COMPACT_SEGMENT_WIDTH * DELTA_SEGMENT_COUNT;

/** Label under each absolute segment — blank for the exact-0/exact-1 edge buckets and the `(0, 0.1)`
 * micro-bucket, which have no single clean decimal boundary; every 0.1-wide bucket labels its own
 * lower bound. */
const ABSOLUTE_BUCKET_LABELS: Record<(typeof ABSOLUTE_SCORE_BUCKET_KEYS)[number], string> = {
  'abs-00': '0',
  'abs-01': '',
  'abs-02': '0.1',
  'abs-03': '0.2',
  'abs-04': '0.3',
  'abs-05': '0.4',
  'abs-06': '0.5',
  'abs-07': '0.6',
  'abs-08': '0.7',
  'abs-09': '0.8',
  'abs-10': '0.9',
  'abs-11': '1',
};

const ColorScale: FC<Props> = ({ variant = ColorScaleVariant.Default }) => {
  const t = useI18n();
  const isCompact = variant === ColorScaleVariant.Compact;
  const isDelta = variant === ColorScaleVariant.Delta;

  if (isDelta) {
    return (
      <div className="inline-flex flex-col gap-0.5 w-[468px]" data-variant={variant}>
        <div className="flex">
          {DELTA_SCORE_BUCKET_KEYS.slice(0, DELTA_SCORE_BUCKET_KEYS.length / 2).map((bucketKey) => (
            <div
              key={bucketKey}
              className={classNames('h-2', getScoreCellBucketClasses(bucketKey)?.background)}
              style={{ width: COMPACT_SEGMENT_WIDTH }}
            />
          ))}
          <div key="neutral" className="h-2 bg-layer-2" style={{ width: COMPACT_SEGMENT_WIDTH }} />
          {DELTA_SCORE_BUCKET_KEYS.slice(DELTA_SCORE_BUCKET_KEYS.length / 2).map((bucketKey) => (
            <div
              key={bucketKey}
              className={classNames('h-2', getScoreCellBucketClasses(bucketKey)?.background)}
              style={{ width: COMPACT_SEGMENT_WIDTH }}
            />
          ))}
        </div>

        <div className="flex dial-tiny-text" style={{ width: DELTA_BAR_WIDTH }}>
          <span className="text-primary flex-1">-1</span>
          <span className="text-secondary flex-1 text-center">0</span>
          <span className="text-primary flex-1 text-right">+1</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames('inline-flex flex-col gap-0.5', isCompact ? 'w-[624px]' : 'w-[840px]')}
      data-variant={variant}
    >
      {!isCompact && (
        <div className="flex justify-between text-sm text-secondary">
          <span>{t(BasicI18nKey.LowAccuracy)}</span>
          <span>{t(BasicI18nKey.HighAccuracy)}</span>
        </div>
      )}

      <div className="flex">
        {ABSOLUTE_SCORE_BUCKET_KEYS.map((bucketKey) => (
          <div
            key={bucketKey}
            className={classNames('h-2', getScoreCellBucketClasses(bucketKey)?.background)}
            style={{ width: isCompact ? COMPACT_SEGMENT_WIDTH : DEFAULT_SEGMENT_WIDTH }}
          />
        ))}
      </div>

      <div className="flex" style={isCompact ? { width: COMPACT_BAR_WIDTH } : undefined}>
        {ABSOLUTE_SCORE_BUCKET_KEYS.map((bucketKey) => (
          <span
            key={bucketKey}
            className={classNames(
              'text-right text-secondary',
              isCompact ? 'dial-tiny-text flex-1' : 'w-[70px] text-sm',
              (bucketKey === 'abs-00' || bucketKey === 'abs-11') && isCompact ? 'text-primary' : undefined,
            )}
          >
            {ABSOLUTE_BUCKET_LABELS[bucketKey]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ColorScale;
