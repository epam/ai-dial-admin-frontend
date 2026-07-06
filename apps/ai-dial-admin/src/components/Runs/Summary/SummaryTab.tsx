'use client';

import { FC, useEffect, useState } from 'react';

import { executeStructuredQuery, getMetricSnapshots } from '@/src/app/[lang]/runs/actions';
import { getTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { RUN_FILTER } from '@/src/components/Runs/View/utils';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Analytics from './Analytics';
import DistributionSection from './DistributionSection';
import Header from './Header';
import MetricScoresSection from './MetricScoresSection';
import { MetricOption, MetricScoresData } from './models';
import {
  buildMetricScoresQuery,
  buildTestCasesStatusQuery,
  parseMetricScores,
  parseTestCaseStatusCounts,
  toMetricOptions,
} from './utils';

interface Props {
  run: Run;
}

const SummaryTab: FC<Props> = ({ run }) => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  // Fetched here (not in the sections) so both Summary sections can share this data.
  const [metricScores, setMetricScores] = useState<MetricScoresData | null>(null);
  const [metricOptions, setMetricOptions] = useState<MetricOption[]>([]);
  const [testCaseCount, setTestCaseCount] = useState(0);
  // Shared across sections: set from the Distribution dropdown or a MetricScores bar click.
  const [selectedMetricName, setSelectedMetricName] = useState<string | null>(null);

  // Reset the selection whenever the shared options change (e.g. a new run).
  useEffect(() => {
    setSelectedMetricName(null);
  }, [metricOptions]);

  useEffect(() => {
    if (!run?.testSuiteId) {
      setTestSuite(null);
      return;
    }

    getTestSuite(run.testSuiteId, DEFAULT_ETAG).then((res) => {
      setTestSuite((res?.response as TestSuite | null) ?? null);
    });
  }, [run?.testSuiteId]);

  useEffect(() => {
    if (!run?.id) {
      setMetricScores(null);
      setMetricOptions([]);
      setTestCaseCount(0);
      return;
    }

    let cancelled = false;
    setMetricScores(null);

    executeStructuredQuery(buildMetricScoresQuery(run.id)).then((result) => {
      if (!cancelled) {
        setMetricScores(parseMetricScores(result));
      }
    });

    executeStructuredQuery(buildTestCasesStatusQuery(run.id)).then((result) => {
      if (!cancelled) {
        setTestCaseCount(parseTestCaseStatusCounts(result).total);
      }
    });

    getMetricSnapshots(RUN_FILTER(run.id)).then((snapshots) => {
      if (!cancelled) {
        setMetricOptions(toMetricOptions(snapshots));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [run?.id]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <Header run={run} testSuite={testSuite} />
      <Analytics run={run} metricOptions={metricOptions} />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <MetricScoresSection data={metricScores} testCaseCount={testCaseCount} onSelectMetric={setSelectedMetricName} />
        <DistributionSection
          run={run}
          metricOptions={metricOptions}
          metricScores={metricScores}
          selectedMetricName={selectedMetricName}
          onSelectMetric={setSelectedMetricName}
        />
      </div>
    </div>
  );
};

export default SummaryTab;
