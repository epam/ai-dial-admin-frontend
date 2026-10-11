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

const ColorScale: FC<Props> = ({ variant = ColorScaleVariant.Default }) => {
  const t = useI18n();
  const isCompact = variant === ColorScaleVariant.Compact;
  const isDelta = variant === ColorScaleVariant.Delta;

  if (isDelta) {
    return (
      <div className="inline-flex flex-col gap-0.5 w-[468px]" data-variant={variant}>
        <div className="flex">
          {DELTA_SCORE_BUCKET_KEYS.slice(0, DELTA_SCORE_BUCKET_KEYS.length / 2).map((bucketKey) => {
            const classes = getScoreCellBucketClasses(bucketKey);
            return (
              <div
                key={bucketKey}
                className={classNames('h-2 border-r border-b', classes?.background, classes?.border)}
                style={{ width: COMPACT_SEGMENT_WIDTH }}
              />
            );
          })}
          <div
            key="neutral"
            className="h-2 bg-layer-2 border-r border-b border-tertiary"
            style={{ width: COMPACT_SEGMENT_WIDTH }}
          />
          {DELTA_SCORE_BUCKET_KEYS.slice(DELTA_SCORE_BUCKET_KEYS.length / 2).map((bucketKey) => {
            const classes = getScoreCellBucketClasses(bucketKey);

            return (
              <div
                key={bucketKey}
                className={classNames('h-2 border-r border-b', classes?.background, classes?.border)}
                style={{ width: COMPACT_SEGMENT_WIDTH }}
              />
            );
          })}
        </div>

        <div className="flex dial-tiny-text" style={{ width: DELTA_BAR_WIDTH }}>
          <span className="text-score-delta-n4 flex-1">-1</span>
          <span className="text-secondary flex-1 text-center">0</span>
          <span className="text-score-delta-p4 flex-1 text-right">+1</span>
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
        {ABSOLUTE_SCORE_BUCKET_KEYS.map((bucketKey) => {
          const classes = getScoreCellBucketClasses(bucketKey);

          return (
            <div
              key={bucketKey}
              className={classNames('h-2 border-r border-b', classes?.background, classes?.border)}
              style={{ width: isCompact ? COMPACT_SEGMENT_WIDTH : DEFAULT_SEGMENT_WIDTH }}
            />
          );
        })}
      </div>

      <div className="flex dial-tiny-text" style={isCompact ? { width: COMPACT_BAR_WIDTH } : undefined}>
        <span className="text-score-abs-00 flex-1 pl-2">0</span>
        <span className="text-score-abs-06 flex-1 text-center">0.5</span>
        <span className="text-score-abs-11 flex-1 text-right pr-2">1</span>
      </div>
    </div>
  );
};

export default ColorScale;
