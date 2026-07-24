'use client';

import { FC } from 'react';

import { Metric } from '@/src/models/evaluation/metric';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScore from './OverallScore';
import ScoreThreshold from './ScoreThreshold';

interface Props {
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  testCaseSchema?: TestCaseSchema[];
  onChange: (testSuite: TestSuite) => void;
}

const ScoreSettings: FC<Props> = ({ selectedTestSuite, metrics, testCaseSchema, onChange }) => (
  <div className="flex w-[516px] flex-col rounded bg-layer-3 p-4">
    <OverallScore
      selectedTestSuite={selectedTestSuite}
      metrics={metrics}
      testCaseSchema={testCaseSchema}
      onChange={onChange}
    />
    <div className="my-4 h-px w-[484px] bg-layer-1" />
    <ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={onChange} />
  </div>
);

export default ScoreSettings;
