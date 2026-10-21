'use client';

import { FC } from 'react';

import { Metric } from '@/src/models/evaluation/metric';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScoreCard from './OverallScoreCard';

interface Props {
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onChange: (testSuite: TestSuite) => void;
}

/** Overall Score entry point on the Metrics tab — summary card + Edit modal. */
const ScoreSettings: FC<Props> = ({ selectedTestSuite, metrics, testCaseSchema, onChange }) => (
  <OverallScoreCard
    selectedTestSuite={selectedTestSuite}
    metrics={metrics}
    testCaseSchema={testCaseSchema}
    onChange={onChange}
  />
);

export default ScoreSettings;
