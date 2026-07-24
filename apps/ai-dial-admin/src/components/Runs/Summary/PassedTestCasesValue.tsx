'use client';

import { FC } from 'react';

import { TestCaseStatusCounts } from '@/src/components/Runs/Summary/models';

interface Props {
  counts: TestCaseStatusCounts;
}

const PassedTestCasesValue: FC<Props> = ({ counts }) => (
  <div className="flex items-baseline gap-1">
    <span className="dial-display-2">{counts.passed}</span>
    <span className="dial-body-text text-secondary">/{counts.total}</span>
  </div>
);

export default PassedTestCasesValue;
