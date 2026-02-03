'use client';

import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  names: string[];
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, names, onChangeTestSuite }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      {/* TODO: ask BE team */}
      {/* <IdControl entity={testSuite} onChangeEntity={onChangeTestSuite} /> */}

      <DisplayNameControl
        displayName={testSuite.name}
        names={names}
        required={true}
        isFullWidth={false}
        onChange={(name) => onChangeTestSuite({ ...testSuite, name })}
      />

      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChangeTestSuite} />
    </div>
  );
};

export default TestSuiteProperties;
