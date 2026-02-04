'use client';

import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  isModal?: boolean;
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChange, isModal = false }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      {isModal && (
        <DisplayNameControl
          displayName={testSuite.name}
          required={true}
          isFullWidth={false}
          onChange={(name) => onChange({ ...testSuite, name })}
        />
      )}
      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChange} />
    </div>
  );
};

export default TestSuiteProperties;
