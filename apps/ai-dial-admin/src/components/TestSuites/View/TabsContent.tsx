'use client';

import { FC } from 'react';

import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent, { PropertiesProps } from '../Properties/TabContent';
import TestCases from '../TestCases/TestCases';

interface Props extends PropertiesProps {
  activeTab: EntityViewTab;
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
