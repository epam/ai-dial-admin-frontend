'use client';

import { FC } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { TestSuits } from '@/src/models/evaluation/test-suit';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';

interface Props {
  testSuit: TestSuits;
  names: string[];
  onChangeTestSuit: (testSuit: TestSuits) => void;
}

const TestSuitProperties: FC<Props> = ({ testSuit, names, onChangeTestSuit }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      <IdControl entity={testSuit} onChangeEntity={onChangeTestSuit} />

      <DisplayNameControl
        displayName={testSuit.name}
        names={names}
        onChange={(name) => onChangeTestSuit({ ...testSuit, name })}
      />

      <DescriptionControl entity={testSuit} onChangeEntity={onChangeTestSuit} />
    </div>
  );
};

export default TestSuitProperties;
