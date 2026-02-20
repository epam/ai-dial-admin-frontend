'use client';

import { FC } from 'react';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import TestCasesList from './TestCasesList';
import TemplateVariables from './TemplateVariables';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const TestCases: FC<Props> = ({ selectedTestSuite, onChange, isSkipRefresh }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-y-6">
      <TemplateVariables selectedTestSuite={selectedTestSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      <TestCasesList selectedTestSuite={selectedTestSuite} onChange={onChange} />
    </div>
  );
};

export default TestCases;
