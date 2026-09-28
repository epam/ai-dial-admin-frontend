'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import CasePassRateLegend from '@/src/components/TestSuites/Trends/CasePassRate/CasePassRateLegend';
import LatestRunDetail from '@/src/components/TestSuites/Trends/CasePassRate/LatestRunDetail';
import RunBar from '@/src/components/TestSuites/Trends/CasePassRate/RunBar';
import {
  BAR_LABEL_HEIGHT,
  BAR_MAX_WIDTH,
  BAR_MIN_WIDTH,
  BAR_TRACK_HEIGHT,
  BAR_WIDTH,
  READOUT_COLUMN_CLASSES,
} from '@/src/components/TestSuites/Trends/CasePassRate/constants';
import { getLatestRunDetail } from '@/src/components/TestSuites/Trends/CasePassRate/utils/case-pass-rate';
import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { CasePassRateSeries } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** Null when the case-pass-rate request failed; empty when the suite has no runs in the window. */
  bars: CasePassRateSeries | null;
  isLoading?: boolean;
}

/**
 * Per-run case outcome mix for the Trends window, with the numeric readout tied to the newest run
 * only. Bars are DOM anchors rather than a chart series so each run keeps its own link, focus stop
 * and accessible name.
 */
const CasePassRatePanel: FC<Props> = ({ bars, isLoading }) => {
  const t = useI18n();
  const latest = bars ? getLatestRunDetail(bars) : null;

  const title = (
    <>
      {t(TestSuitesI18nKey.CasesPassed)}{' '}
      <span className="font-normal text-secondary">
        · {t(TestSuitesI18nKey.TrendsLastNRuns, { count: TRENDS_RUN_WINDOW })}
      </span>
    </>
  );

  const renderPanel = (children: ReactNode, control?: ReactNode) => (
    <SummarySection isFillHeight={false} title={title} control={control} className="h-full w-full">
      {children}
    </SummarySection>
  );

  /**
   * The chart column takes the slack so the readout ends flush with the card's right edge, where
   * `SummarySection` right-aligns the heading it shares a width with (design.md D3).
   */
  const renderSplit = (chart: ReactNode, readout: ReactNode) =>
    renderPanel(
      <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3">{chart}</div>
        <div className={classNames(READOUT_COLUMN_CLASSES, 'xl:border-l xl:border-secondary')}>{readout}</div>
      </div>,
      <p className={classNames(READOUT_COLUMN_CLASSES, 'hidden dial-body-semi-text text-primary xl:block')}>
        {t(TestSuitesI18nKey.TrendsLatestRun)}
      </p>,
    );

  if (isLoading) {
    return renderSplit(
      <>
        <CasePassRateLegend />
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch gap-1" style={{ height: BAR_TRACK_HEIGHT }}>
            {Array.from({ length: TRENDS_RUN_WINDOW }, (_, index) => (
              <span
                key={index}
                className="rounded-sm bg-layer-1"
                style={{ flex: `1 1 ${BAR_WIDTH}px`, minWidth: BAR_MIN_WIDTH, maxWidth: BAR_MAX_WIDTH }}
              />
            ))}
          </div>
          {/* Reserves the rotated run labels' height. */}
          <div style={{ height: BAR_LABEL_HEIGHT }} />
        </div>
      </>,
      <div className="flex flex-col gap-4">
        <span className="h-4 w-24 rounded-sm bg-layer-1" />
        <span className="h-9 w-32 rounded-sm bg-layer-1" />
        <span className="h-4 w-20 rounded-sm bg-layer-1" />
      </div>,
    );
  }

  if (!bars) {
    return renderPanel(
      <p className="dial-body-text text-secondary" role="status">
        {t(TestSuitesI18nKey.CasePassRateUnavailable)}
      </p>,
    );
  }

  if (!latest) {
    return renderPanel(
      <p className="dial-body-text text-secondary" role="status">
        {t(TestSuitesI18nKey.TrendsNoRunsTitle)}
      </p>,
    );
  }

  const trendBars = bars.slice(0, -1);

  return renderSplit(
    <>
      <CasePassRateLegend />
      {/* Every bar in one row, so a single growth distribution covers them. Oldest first, and a
          short window is not padded with empty tracks. */}
      <div className="flex min-w-0 items-stretch gap-1 overflow-x-auto">
        {trendBars.map((bar) => (
          <RunBar key={bar.runId} bar={bar} isLatest={false} />
        ))}
        <div className="mx-2 shrink-0 border-l border-secondary" />
        <RunBar bar={latest.bar} isLatest />
      </div>
    </>,
    <LatestRunDetail detail={latest} />,
  );
};

export default CasePassRatePanel;
