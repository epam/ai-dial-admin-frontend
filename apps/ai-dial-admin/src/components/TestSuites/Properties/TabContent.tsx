'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedTestSuite }) => {
  return (
    <div className="flex flex-col">
      <EntityInfoHeader id={selectedTestSuite.id} entity={selectedTestSuite} />
      <div className="flex-1 min-h-0 pt-8">Properties Content</div>
    </div>
  );
};

export default PropertiesTabContent;
