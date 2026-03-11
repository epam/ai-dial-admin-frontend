'use client';

import { FC, useCallback, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import Header from './components/Header';
import TabsContent from './tabs/TabsContent';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const RequestTemplate: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const tabs = getTestSuiteRequestTemplateTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Body);

  const onChangeActiveTab = useCallback((id: string) => {
    setActiveTab(id as EntityViewTab);
  }, []);

  return (
    <div className="flex flex-col size-full gap-2">
      <div className="flex flex-col gap-4">
        <Header testSuite={testSuite} onChangeTestSuite={onChangeTestSuite} />
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
      </div>
      <TabsContent activeTab={activeTab} selectedTestSuite={testSuite} onChange={onChangeTestSuite} />
    </div>
  );
};

export default RequestTemplate;
