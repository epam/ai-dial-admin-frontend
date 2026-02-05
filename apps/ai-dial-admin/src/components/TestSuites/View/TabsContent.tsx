'use client';

import { FC } from 'react';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from '../Properties/TabContent';
import TestCases from '../TestCases/TestCases';

interface Props {
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedTestSuite }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent selectedTestSuite={selectedTestSuite} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.TestCases && <TestCases selectedTestSuite={selectedTestSuite} onChange={onChange} />}
      {activeTab === EntityViewTab.Runs && <div>Runs</div>}
      {activeTab === EntityViewTab.Trends && <div>Trends</div>}
    </>
  );
};

export default TabsContent;
