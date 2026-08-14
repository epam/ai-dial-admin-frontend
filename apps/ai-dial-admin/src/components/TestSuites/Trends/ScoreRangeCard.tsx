'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { formatScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  title: string;
  scoreMin: number | null;
  scoreMax: number | null;
  latestScore: number | null;
  runCount: number;
  className?: string;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const toPercent = (value: number): number => clamp01(value) * 100;

const ScoreRangeCard: FC<Props> = ({ title, scoreMin, scoreMax, latestScore, runCount, className }) => {
  const t = useI18n();
  const hasRange = scoreMin != null && scoreMax != null;
  const minPct = hasRange ? toPercent(scoreMin) : 0;
  const maxPct = hasRange ? toPercent(scoreMax) : 0;
  const rangeWidthPct = Math.max(maxPct - minPct, 0);
  const latestPct = latestScore != null ? toPercent(latestScore) : null;
  const isCollapsedRange = hasRange && scoreMin === scoreMax;
  const isLatestWorst = hasRange && latestScore != null && scoreMin < scoreMax && latestScore === scoreMin;
  const markerClass = isLatestWorst ? 'bg-error' : 'bg-accent-secondary';
  const latestLabelClass = isLatestWorst ? 'text-error' : 'text-accent-secondary';
  const latestDotClass = isLatestWorst ? 'bg-error' : 'bg-accent-secondary';
  let latestLabel: string | null = null;
  if (latestScore != null) {
    latestLabel = isLatestWorst
      ? t(TestSuitesI18nKey.ScoreRangeLatestWorst, { value: formatScore(latestScore) })
      : t(TestSuitesI18nKey.ScoreRangeLatest, { value: formatScore(latestScore) });
  }

  const collapsedAnchorPct = latestPct ?? minPct;

  return (
    <div
      className={classNames(
        'flex flex-col justify-between gap-3 rounded-lg border border-secondary bg-layer-3 p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="dial-small-text text-secondary">{title}</p>
        {hasRange ? (
          <p className="dial-display2-text text-primary">
            {formatScore(scoreMin)} - {formatScore(scoreMax)}
          </p>
        ) : (
          <p className="dial-display2-text text-secondary">—</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative h-4 w-full">
          <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-sm bg-layer-1" />
          {hasRange && !isCollapsedRange && (
            <>
              {rangeWidthPct > 0 && (
                <div
                  className="absolute top-1/2 h-2 -translate-y-1/2 bg-controls-neutral-active"
                  style={{ left: `${minPct}%`, width: `${rangeWidthPct}%` }}
                />
              )}
              <div
                className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-secondary"
                style={{ left: `calc(${minPct}% - 0.5px)` }}
              />
              <div
                className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-secondary"
                style={{ left: `calc(${maxPct}% - 0.5px)` }}
              />
            </>
          )}
          {isCollapsedRange ? (
            <div
              className="absolute top-1/2 z-[1] flex -translate-y-1/2 items-center"
              style={{ left: `clamp(0px, calc(${collapsedAnchorPct}% - 3px), calc(100% - 6px))` }}
            >
              <div className="h-2.5 w-px shrink-0 bg-secondary" />
              <div className="relative shrink-0" style={{ width: 4, height: 12 }}>
                <div className="absolute bg-layer-1" style={{ left: 0, top: 2, width: 4, height: 8 }} />
                <div
                  className={classNames('absolute', markerClass)}
                  style={{ left: 1, top: 0, width: 2, height: 12 }}
                />
              </div>
              <div className="h-2.5 w-px shrink-0 bg-secondary" />
            </div>
          ) : (
            latestPct != null && (
              <div
                className="absolute top-1/2 z-[1] -translate-y-1/2"
                style={{ left: `calc(${latestPct}% - 2px)`, width: 4, height: 12 }}
              >
                <div className="absolute bg-layer-1" style={{ left: 0, top: 2, width: 4, height: 8 }} />
                <div
                  className={classNames('absolute', markerClass)}
                  style={{ left: 1, top: 0, width: 2, height: 12 }}
                />
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 dial-tiny-text text-secondary">
            <span className="size-1 rounded-full bg-secondary" />
            {t(TestSuitesI18nKey.TrendsRunsCount, { count: runCount })}
          </span>
          {latestScore != null && scoreMin !== scoreMax && (
            <span className={classNames('flex items-center gap-1 dial-tiny-text', latestLabelClass)}>
              <span className={classNames('size-1 rounded-full', latestDotClass)} />
              {latestLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreRangeCard;
