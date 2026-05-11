'use client';

import { FC, useCallback, useRef, useState } from 'react';

import { DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import TabsContent, { TabsContentRef } from './tabs/TabsContent';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import ContentTypeSelect from './components/ContentTypeSelect';
import TemplateVariablesDoc from './components/TemplateVariablesDoc';

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

  const onAddRow = useCallback(() => {
    tabsContentRef.current?.add?.();
  }, []);

  const isBodyFormData =
    activeTab === EntityViewTab.Body && testSuite.requestTemplate?.body?.contentType !== ContentType.JSON;

  const showAddButton = activeTab === EntityViewTab.Parameters || activeTab === EntityViewTab.Headers || isBodyFormData;
  const showVariablesDoc = activeTab === EntityViewTab.Body && !isBodyFormData;

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <div className="flex flex-row justify-between items-start mb-3">
        <h3>{t(TestSuitesI18nKey.RequestTemplate)}</h3>
        <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={onChangeTestSuite} />
      </div>

      <div className="flex flex-row justify-between items-start mb-3">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        {showAddButton && (
          <DialNeutralButton iconBefore={<IconPlus />} label={t(ButtonsI18nKey.Add)} onClick={onAddRow} />
        )}
        {showVariablesDoc && (
          <div className="flex-none">
            <TemplateVariablesDoc />
          </div>
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
