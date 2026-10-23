'use client';

import classNames from 'classnames';
import { FC, useMemo } from 'react';

import { EllipsisTooltip, Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';
import ReactECharts from 'echarts-for-react';

import LatestRunLegendRow from '@/src/components/TestSuites/Trends/TestCases/LatestRunLegendRow';
import {
  LATEST_RUN_SEGMENT_COLORS,
  buildLatestRunGaugeOptions,
} from '@/src/components/TestSuites/Trends/TestCases/utils/latest-run-gauge-options';
import { getTestCasesSegmentLabels } from '@/src/components/TestSuites/Trends/TestCases/utils/test-cases-labels';
import { TEST_CASE_SEGMENT_BG } from '@/src/components/TestSuites/Trends/constants';
import { LatestRunGaugeSlice, RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** Gauge plot size from Figma frame 11960:157086. */
const GAUGE_WIDTH_PX = 240;
const GAUGE_HEIGHT_PX = 120;

interface Props {
  segments: RunTestCaseSegments | null;
  /** When false, legend is Completed / Error or N/A (Figma 11977:225357); below segment is hidden. */
  hasThreshold?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}

const LatestRunCard: FC<Props> = ({ segments, hasThreshold = true, isLoading, hasError, className }) => {
  const t = useI18n();
  const title = t(TestSuitesI18nKey.TrendsLatestRun);
  const labels = getTestCasesSegmentLabels(t, hasThreshold);

  const above = segments?.above ?? 0;
  const below = segments?.below ?? 0;
  const errorOrNa = segments?.errorOrNa ?? 0;
  const total = segments?.total ?? 0;
  const runName = segments?.runName ?? '';

  const gaugeSlices = useMemo((): LatestRunGaugeSlice[] => {
    const slices: LatestRunGaugeSlice[] = [];
    if (above > 0) {
      slices.push({ name: labels.successLabel, value: above, color: LATEST_RUN_SEGMENT_COLORS.above });
    }
    if (labels.belowLabel != null && below > 0) {
      slices.push({ name: labels.belowLabel, value: below, color: LATEST_RUN_SEGMENT_COLORS.below });
    }
    if (errorOrNa > 0) {
      slices.push({ name: labels.errorLabel, value: errorOrNa, color: LATEST_RUN_SEGMENT_COLORS.errorOrNa });
    }
    return slices;
  }, [above, below, errorOrNa, labels.belowLabel, labels.errorLabel, labels.successLabel]);

  const chartOptions = useMemo(() => buildLatestRunGaugeOptions(gaugeSlices), [gaugeSlices]);

  const ariaLabel =
    labels.belowLabel != null
      ? `${runName}: ${total} ${labels.testCasesLabel}, ${above} ${labels.successLabel}, ${below} ${labels.belowLabel}, ${errorOrNa} ${labels.errorLabel}`
      : `${runName}: ${total} ${labels.testCasesLabel}, ${above} ${labels.successLabel}, ${errorOrNa} ${labels.errorLabel}`;

  return (
    <section
      className={classNames(
        'flex w-full shrink-0 flex-col gap-3 rounded-lg border border-secondary bg-layer-3 p-4 xl:w-[379px]',
        className,
      )}
      aria-label={title}
    >
      <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
        <h3 className="dial-body-semi-text shrink-0 text-primary">{title}</h3>
        {runName ? (
          <EllipsisTooltip text={runName} className="min-w-0 max-w-[50%] dial-tiny-text text-secondary" />
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-4">
        {isLoading && segments == null ? (
          <div className="flex items-center justify-center" style={{ height: GAUGE_HEIGHT_PX }}>
            <Spinner size={32} />
          </div>
        ) : hasError ? (
          <Notification
            variant={NotificationVariant.Error}
            type={NotificationType.SectionMessage}
            iconSize={20}
            message={t(TestSuitesI18nKey.TrendsTestCasesLoadFailed)}
            role="alert"
          />
        ) : (
          <div
            className="relative shrink-0"
            style={{ width: GAUGE_WIDTH_PX, height: GAUGE_HEIGHT_PX }}
            role="img"
            aria-label={ariaLabel}
          >
            <ReactECharts
              option={chartOptions}
              style={{ width: GAUGE_WIDTH_PX, height: GAUGE_HEIGHT_PX }}
              opts={{ renderer: 'svg' }}
              notMerge
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 pb-0">
              <span className="dial-display2-text text-primary">{total}</span>
              <span className="dial-small-text text-secondary">{labels.testCasesLabel}</span>
            </div>
          </div>
        )}
        {!hasError && (
          <div className="flex w-full flex-col gap-1">
            <LatestRunLegendRow swatchClass={TEST_CASE_SEGMENT_BG.above} label={labels.successLabel} count={above} />
            {labels.belowLabel != null && (
              <LatestRunLegendRow swatchClass={TEST_CASE_SEGMENT_BG.below} label={labels.belowLabel} count={below} />
            )}
            <LatestRunLegendRow
              swatchClass={TEST_CASE_SEGMENT_BG.errorOrNa}
              label={labels.errorLabel}
              count={errorOrNa}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestRunCard;
