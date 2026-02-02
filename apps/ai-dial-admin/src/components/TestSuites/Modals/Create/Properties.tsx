'use client';

import { FC } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';

interface Props {
  testSuite: TestSuite;
  names: string[];
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, names, onChangeTestSuite }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      <IdControl entity={testSuite} onChangeEntity={onChangeTestSuite} />

      <DisplayNameControl
        displayName={testSuite.name}
        names={names}
        onChange={(name) => onChangeTestSuite({ ...testSuite, name })}
      />

      <DescriptionControl entity={testSuite} onChangeEntity={onChangeTestSuite} />
    </div>
  );
};

export default TestSuiteProperties;
