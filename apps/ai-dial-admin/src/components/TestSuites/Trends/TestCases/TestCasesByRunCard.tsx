'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import RunBar, { BAR_PLOT_HEIGHT_PX } from '@/src/components/TestSuites/Trends/TestCases/RunBar';
import TestCasesLegendItem from '@/src/components/TestSuites/Trends/TestCases/TestCasesLegendItem';
import { getTestCasesSegmentLabels } from '@/src/components/TestSuites/Trends/TestCases/utils/test-cases-labels';
import { TEST_CASE_SEGMENT_BG } from '@/src/components/TestSuites/Trends/constants';
import { RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  segments: RunTestCaseSegments[];
  runOrder: TrendsRunPoint[];
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}

const TestCasesByRunCard: FC<Props> = ({ segments, runOrder, isLoading, hasError, className }) => {
  const t = useI18n();
  const hasThreshold = runOrder.some((run) => run.overallScoreThreshold != null);
  const hasNoThreshold = runOrder.some((run) => run.overallScoreThreshold == null);
  const labels = getTestCasesSegmentLabels(t, hasThreshold);

  return (
    <section
      className={classNames(
        'flex w-full shrink-0 flex-col gap-4 rounded-lg border border-secondary bg-layer-3 p-4 xl:w-[379px]',
        className,
      )}
      aria-label={labels.title}
    >
      <h3 className="dial-body-semi-text text-primary">{labels.title}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {hasThreshold && <TestCasesLegendItem swatchClass={TEST_CASE_SEGMENT_BG.above} label={labels.aboveLabel} />}
        {hasNoThreshold && (
          <TestCasesLegendItem swatchClass={TEST_CASE_SEGMENT_BG.above} label={labels.completedLabel} />
        )}
        {labels.belowLabel != null && (
          <TestCasesLegendItem swatchClass={TEST_CASE_SEGMENT_BG.below} label={labels.belowLabel} />
        )}
        <TestCasesLegendItem swatchClass={TEST_CASE_SEGMENT_BG.errorOrNa} label={labels.errorLabel} />
      </div>
      {isLoading && segments.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: BAR_PLOT_HEIGHT_PX }}>
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
        <div className="flex w-full items-stretch gap-3 justify-center" style={{ height: BAR_PLOT_HEIGHT_PX }}>
          {segments.map((run) => (
            <RunBar
              key={run.runId}
              segments={run}
              successLabel={run.overallScoreThreshold != null ? labels.aboveLabel : labels.completedLabel}
              completedLabel={labels.completedLabel}
              belowLabel={labels.belowLabel}
              aboveLabel={labels.aboveLabel}
              errorLabel={labels.errorLabel}
              totalLabel={labels.totalLabel}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TestCasesByRunCard;
