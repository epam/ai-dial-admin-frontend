'use client';

import { FC, useCallback, useRef, useState } from 'react';

import { DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import TabsContent, { TabsContentRef } from './tabs/TabsContent';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import ContentTypeSelect from './components/ContentTypeSelect';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const RequestTemplate: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const tabs = getTestSuiteRequestTemplateTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Body);
  const tabsContentRef = useRef<TabsContentRef>(null);

  const onChangeActiveTab = useCallback((id: string) => {
    setActiveTab(id as EntityViewTab);
  }, []);

  const onAddParamOrHeader = useCallback(() => {
    tabsContentRef.current?.add?.();
  }, []);

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded h-[480px] p-4">
      <div className="flex flex-row justify-between items-start mb-4">
        <h3>{t(TestSuitesI18nKey.RequestTemplate)}</h3>
        <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={onChangeTestSuite} />
      </div>

      <div className="flex flex-row justify-between items-start mb-4">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        {activeTab !== EntityViewTab.Body && (
          <DialNeutralButton iconBefore={<IconPlus />} label={t(ButtonsI18nKey.Add)} onClick={onAddParamOrHeader} />
        )}
      </div>

      <TabsContent
        ref={tabsContentRef}
        activeTab={activeTab}
        selectedTestSuite={testSuite}
        onChange={onChangeTestSuite}
      />
    </div>
  );
};

export default RequestTemplate;
