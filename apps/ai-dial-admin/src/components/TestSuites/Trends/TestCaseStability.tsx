'use client';

import { FC, useMemo } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import HeatMapGrid from '@/src/components/Common/HeatMap/HeatMapGrid';
import { HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE } from '@/src/components/Common/HeatMap/constants';
import { ColorScaleVariant } from '@/src/components/Common/ColorScale/ColorScale';
import SummarySection from '@/src/components/Runs/Summary/SummarySection';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { useTestCaseStabilityData } from '@/src/components/TestSuites/Trends/use-test-case-stability-data';
import { buildStabilityColumns } from '@/src/components/TestSuites/Trends/utils/build-stability-columns';
import { formatTrendsRunsCountLabel } from '@/src/components/TestSuites/Trends/utils/trends-runs-count-label';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  runOrder: TrendsRunPoint[];
  runCount: number;
}

const TestCaseStability: FC<Props> = ({ runOrder, runCount }) => {
  const t = useI18n();
  const { currentTheme } = useTheme();
  const { matrix, isLoading } = useTestCaseStabilityData(runOrder);

  const labels = useMemo(
    () => ({
      testCase: t(TestSuitesI18nKey.TrendsStabilityTooltipTestCase),
      run: t(TestSuitesI18nKey.TrendsTooltipRun),
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
      theme: currentTheme,
      labels,
    });
  }, [matrix, currentTheme, labels]);

  const hasData = (matrix?.rows.length ?? 0) > 0 && (matrix?.testCaseColIds.length ?? 0) > 0;

  return (
    <SummarySection
      isFillHeight={false}
      title={
        <>
          {t(TestSuitesI18nKey.TestCaseStability)}{' '}
          <span className="dial-body-text text-secondary">· {formatTrendsRunsCountLabel(t, runCount)}</span>
        </>
      }
    >
      {isLoading && !matrix ? (
        <div className="flex h-[220px] items-center justify-center">
          <DialLoader size={32} />
        </div>
      ) : !hasData ? (
        <DialNoDataContent title={t(BasicI18nKey.NoData)} />
      ) : (
        <div className="flex min-h-[280px] h-[min(480px,50vh)] flex-col">
          <HeatMapGrid
            columnDefs={columnDefs}
            rowData={matrix?.rows ?? []}
            headerLabels={matrix?.headerLabels ?? []}
            emptyTitle={t(BasicI18nKey.NoData)}
            valueColumnIdPrefix={HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE}
            colorScaleVariant={ColorScaleVariant.Compact}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
          />
        </div>
      )}
    </SummarySection>
  );
};

export default TestCaseStability;
