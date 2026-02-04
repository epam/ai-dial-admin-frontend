'use client';

import { FC } from 'react';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from '../Properties/TabContent';

interface Props {
  activeTab: EntityViewTab;
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TabsContent: FC<Props> = ({ activeTab }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent selectedTestSuite={selectedTestSuite} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.TestCases && <div>Test Cases</div>}
      {activeTab === EntityViewTab.Runs && <div>Runs</div>}
      {activeTab === EntityViewTab.Trends && <div>Trends</div>}
    </>
  );
};

export default TabsContent;
