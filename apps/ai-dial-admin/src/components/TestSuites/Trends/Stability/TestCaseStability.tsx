'use client';

import { FC, useMemo } from 'react';

import { NoDataContent, Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import HeatMapGrid from '@/src/components/Common/HeatMap/HeatMapGrid';
import { HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE } from '@/src/components/Common/HeatMap/constants';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { useTestCaseStabilityData } from '@/src/components/TestSuites/Trends/Stability/use-test-case-stability-data';
import { buildStabilityColumns } from '@/src/components/TestSuites/Trends/Stability/utils/build-stability-columns';
import { getStabilityMethodLabel } from '@/src/components/TestSuites/Trends/Stability/utils/stability-method-label';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  runOrder: TrendsRunPoint[];
  selectedTestSuite: TestSuite;
}

const TestCaseStability: FC<Props> = ({ runOrder, selectedTestSuite }) => {
  const t = useI18n();
  const { matrix, isLoading, hasError } = useTestCaseStabilityData(runOrder);

  const latestMetricCount = runOrder[runOrder.length - 1]?.metricNames?.length ?? 0;
  const methodLabel = useMemo(
    () => getStabilityMethodLabel(selectedTestSuite, latestMetricCount, t),
    [selectedTestSuite, latestMetricCount, t],
  );

  const labels = useMemo(
    () => ({
      testCase: t(TestSuitesI18nKey.TrendsStabilityTooltipTestCase),
      run: t(TestSuitesI18nKey.TrendsTooltipRun),
      threshold: t(TestSuitesI18nKey.TrendsThresholdLabel),
      score: t(TestSuitesI18nKey.TrendsTooltipScore),
      passed: t(TestSuitesI18nKey.TrendsStabilityTooltipPassed),
      notApplicable: t(TestSuitesI18nKey.TrendsStabilityNotApplicable),
      passedYes: t(BasicI18nKey.Yes),
      passedNo: t(BasicI18nKey.No),
    }),
    [t],
  );

  const columnDefs = useMemo(() => {
    if (!matrix) {
      return [];
    }
    return buildStabilityColumns({
      testCaseColIds: matrix.testCaseColIds,
      headerLabels: matrix.headerLabels,
      cellMeta: matrix.cellMeta,
      thresholdByRowId: matrix.thresholdByRowId,
      labels,
    });
  }, [matrix, labels]);

  const hasData = (matrix?.rows.length ?? 0) > 0 && (matrix?.testCaseColIds.length ?? 0) > 0;

  return (
    <SummarySection
      isFillHeight={false}
      title={
        <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span>{t(TestSuitesI18nKey.TestCaseStability)}</span>
          {methodLabel && (
            <span className="dial-body-text inline-flex items-center gap-2 text-secondary">
              <span className="size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
              {methodLabel}
            </span>
          )}
        </span>
      }
    >
      {isLoading && !matrix ? (
        <div className="flex h-[220px] items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : hasError ? (
        <Notification
          variant={NotificationVariant.Error}
          type={NotificationType.SectionMessage}
          iconSize={20}
          message={t(TestSuitesI18nKey.TrendsStabilityLoadFailed)}
          role="alert"
        />
      ) : !hasData ? (
        <NoDataContent title={t(BasicI18nKey.NoData)} />
      ) : (
        <HeatMapGrid
          columnDefs={columnDefs}
          rowData={matrix?.rows ?? []}
          headerLabels={matrix?.headerLabels ?? []}
          emptyTitle={t(BasicI18nKey.NoData)}
          valueColumnIdPrefix={HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE}
          colorScaleVariant={ColorScaleVariant.Compact}
          autoHeight
          className="flex flex-col gap-4"
        />
      )}
    </SummarySection>
  );
};

export default TestCaseStability;
