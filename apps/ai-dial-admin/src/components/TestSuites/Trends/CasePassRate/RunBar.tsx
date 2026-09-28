'use client';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import {
  BAR_LABEL_HEIGHT,
  BAR_MAX_WIDTH,
  BAR_MIN_WIDTH,
  BAR_TRACK_HEIGHT,
  BAR_WIDTH,
  LATEST_BAR_MAX_WIDTH,
  LATEST_BAR_MIN_WIDTH,
  LATEST_BAR_SCALE,
  LATEST_BAR_WIDTH,
  SEGMENT_BG_CLASSES,
} from '@/src/components/TestSuites/Trends/CasePassRate/constants';
import { CasePassRateBar } from '@/src/components/TestSuites/Trends/models';
import { formatTrendTooltipDate } from '@/src/components/TestSuites/Trends/utils/format';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';

interface Props {
  bar: CasePassRateBar;
  isLatest: boolean;
}

/**
 * One run's column: a fixed-height track whose full height is the run's `totalCount`, filled
 * bottom-up. The whole column is the hover, focus and navigation target — segments are not
 * individually interactive.
 */
const RunBar: FC<Props> = ({ bar, isLatest }) => {
  const t = useI18n();
  const date = bar.createdAtMs != null ? formatTrendTooltipDate(bar.createdAtMs) : '';

  const accessibleName = t(TestSuitesI18nKey.CasePassRateBarLabel, {
    run: bar.label,
    date,
    passed: bar.passedCount,
    failed: bar.failedCount,
    errored: bar.erroredCount,
    notScored: bar.notScoredCount,
    total: bar.totalCount,
  });

  const tooltip: ReactNode = (
    <div className="dial-tiny-text flex flex-col">
      <span className="text-primary">{date ? `${bar.label} · ${date}` : bar.label}</span>
      <span className="text-accent-secondary">
        {bar.passedCount} {t(RunsI18nKey.Pass)}
      </span>
      <span className="text-error">
        {bar.failedCount} {t(RunsI18nKey.Fail)}
      </span>
      <span className="text-secondary">
        {bar.erroredCount} {t(RunsI18nKey.ExecError)}
      </span>
      <span className="text-warning">
        {bar.notScoredCount} {t(RunsI18nKey.NotScored)}
      </span>
      {bar.notRunCount > 0 && (
        <span className="text-secondary">{t(TestSuitesI18nKey.CasePassRateNotRun, { count: bar.notRunCount })}</span>
      )}
      {bar.status === RunStatus.RUNNING && (
        <span className="text-secondary">{t(TestSuitesI18nKey.CasePassRateInProgress)}</span>
      )}
    </div>
  );

  const track = (
    <>
      <span
        className={classNames(
          'relative w-full overflow-hidden rounded-sm bg-layer-1',
          isLatest && 'border border-accent-primary',
        )}
        style={{ height: BAR_TRACK_HEIGHT }}
      >
        {/*
          Stacked from the bottom with an explicit offset per segment rather than a flex column, so
          a segment's height stays a share of `totalCount` even when the buckets sum below it and
          the remainder must read as unfilled track.
        */}
        {bar.segments.map((segment, index) => {
          const offsetPercent = bar.segments.slice(0, index).reduce((total, previous) => total + previous.percent, 0);

          return (
            <span
              key={segment.kind}
              className={classNames(
                'absolute inset-x-0 border-t border-tertiary first:border-t-0',
                SEGMENT_BG_CLASSES[segment.kind],
              )}
              style={{ bottom: `${offsetPercent}%`, height: `${segment.percent}%` }}
            />
          );
        })}
      </span>
      {/* `vertical-rl` + `rotate-180` reads bottom-to-top; truncation then runs along the height. */}
      <span
        className={classNames(
          'dial-tiny-text truncate rotate-180 [writing-mode:vertical-rl]',
          isLatest ? 'font-semibold text-accent-primary' : 'text-secondary',
        )}
        style={{ height: BAR_LABEL_HEIGHT }}
      >
        {bar.label}
      </span>
    </>
  );

  const columnClasses = classNames(
    'flex w-full min-w-0 flex-col items-center gap-2 rounded-sm',
    'focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-focus',
  );

  // The sized root is the bar row's flex item. Every bar grows to fill the row rather than leaving
  // dead space at the card's right edge; the latest one takes a larger share at every size via its
  // grow factor, so it stays the widest.
  const rootStyle = isLatest
    ? {
        flex: `${LATEST_BAR_SCALE} 1 ${LATEST_BAR_WIDTH}px`,
        minWidth: LATEST_BAR_MIN_WIDTH,
        maxWidth: LATEST_BAR_MAX_WIDTH,
      }
    : { flex: `1 1 ${BAR_WIDTH}px`, minWidth: BAR_MIN_WIDTH, maxWidth: BAR_MAX_WIDTH };

  return (
    <span className="flex" style={rootStyle}>
      <DialTooltip tooltip={tooltip} placement="top" triggerClassName="flex w-full min-w-0">
        {bar.href ? (
          <a href={bar.href} aria-label={accessibleName} className={columnClasses}>
            {track}
          </a>
        ) : (
          <span role="img" aria-label={accessibleName} className={columnClasses}>
            {track}
          </span>
        )}
      </DialTooltip>
    </span>
  );
};

export default RunBar;
