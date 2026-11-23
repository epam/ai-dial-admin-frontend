'use client';

import { FC } from 'react';

import { AnalyticsCard, Spinner } from '@epam/ai-dial-ui-kit';

import CardFooter from '@/src/components/Runs/Summary/Cards/CardFooter';
import CostValue from '@/src/components/Runs/Summary/Cards/CostValue';
import { CardValueSection } from '@/src/components/Runs/Summary/Cards/models';
import OverallScoreMethod from '@/src/components/Runs/Summary/Cards/OverallScoreMethod';
import OverallScoreValue from '@/src/components/Runs/Summary/Cards/OverallScoreValue';
import PassRateValue from '@/src/components/Runs/Summary/Cards/PassRateValue';
import RuntimeValue from '@/src/components/Runs/Summary/Cards/RuntimeValue';
import TestCasesCompletedValue from '@/src/components/Runs/Summary/Cards/TestCasesCompletedValue';
import { ANALYTICS_KPI_CARD_CLASS, ANALYTICS_KPI_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { useRunKpiCards } from '@/src/components/Runs/Summary/use-run-kpi-cards';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
}

const Analytics: FC<Props> = ({ run, overallScore, metricSnapshotCount }) => {
  const t = useI18n();
  const kpis = useRunKpiCards({ run, metricSnapshotCount });

  if (!kpis) {
    return (
      <div className="flex h-24 items-center">
        <Spinner size={32} fullWidth />
      </div>
    );
  }

  const { figures, sourceLabel, cost } = kpis;
  const rateTitle = t(kpis.rateTitleKey);

  return (
    <div className={ANALYTICS_KPI_GRID_CLASS}>
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TestCasesCompleted)}
        value={
          <TestCasesCompletedValue
            breakdown={figures.breakdown}
            hasThreshold={figures.hasThreshold}
            section={CardValueSection.Figure}
          />
        }
        description={
          <CardFooter>
            <TestCasesCompletedValue
              breakdown={figures.breakdown}
              hasThreshold={figures.hasThreshold}
              section={CardValueSection.Footer}
            />
          </CardFooter>
        }
        error={kpis.hasNoTestCases}
      />
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={rateTitle}
        value={
          <PassRateValue
            rate={figures.rate}
            threshold={figures.threshold}
            label={rateTitle}
            section={CardValueSection.Figure}
          />
        }
        description={
          <CardFooter>
            <PassRateValue
              rate={figures.rate}
              threshold={figures.threshold}
              label={rateTitle}
              section={CardValueSection.Footer}
            />
          </CardFooter>
        }
        error={kpis.hasNoTestCases}
      />
      {overallScore != null && (
        <AnalyticsCard
          className={ANALYTICS_KPI_CARD_CLASS}
          title={t(RunsI18nKey.OverallScore)}
          value={<OverallScoreValue score={overallScore} threshold={figures.threshold} />}
          description={
            kpis.scoreMethod && (
              <CardFooter>
                <OverallScoreMethod scoreMethod={kpis.scoreMethod} metricCount={metricSnapshotCount ?? 0} />
              </CardFooter>
            )
          }
        />
      )}
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TotalRuntime)}
        value={
          <RuntimeValue
            sourceMs={figures.sourceMs}
            metricsMs={figures.metricsMs}
            sourceLabel={sourceLabel}
            section={CardValueSection.Figure}
          />
        }
        description={
          <CardFooter>
            <RuntimeValue
              sourceMs={figures.sourceMs}
              metricsMs={figures.metricsMs}
              sourceLabel={sourceLabel}
              section={CardValueSection.Footer}
            />
          </CardFooter>
        }
        error={kpis.hasRuntimeError}
      />
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TotalRunCost)}
        value={<CostValue cost={cost} sourceLabel={sourceLabel} section={CardValueSection.Figure} />}
        description={
          <CardFooter>
            <CostValue cost={cost} sourceLabel={sourceLabel} section={CardValueSection.Footer} />
          </CardFooter>
        }
        error={cost.hasError}
      />
    </div>
  );
};

export default Analytics;
