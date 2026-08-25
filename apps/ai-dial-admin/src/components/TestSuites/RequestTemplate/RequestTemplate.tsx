'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialNeutralButton, DialNoDataContent, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { JsonataVariable } from '@/src/models/jsonata';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { getBodyText } from '@/src/components/TestSuites/utils/body-content';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import TabsContent, { TabsContentRef } from './tabs/TabsContent';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import ContentTypeSelect from './components/ContentTypeSelect';
import JsonataToggle from './components/JsonataToggle';
import TemplateVariablesDoc from './components/TemplateVariablesDoc';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
  jsonataVariables?: JsonataVariable[];
}

const RequestTemplate: FC<Props> = ({ testSuite, onChangeTestSuite, jsonataVariables }) => {
  const t = useI18n();
  const tabs = getTestSuiteRequestTemplateTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Body);
  const tabsContentRef = useRef<TabsContentRef>(null);
  const [bodyText, setBodyText] = useState(() => getBodyText(testSuite.requestTemplate?.body));
  const endpointKey = `${testSuite.endpointRef?.method ?? ''}:${testSuite.endpointRef?.relativeUrlPattern ?? ''}`;
  const previousEndpointKeyRef = useRef(endpointKey);

  useEffect(() => {
    if (previousEndpointKeyRef.current === endpointKey) {
      return;
    }
    previousEndpointKeyRef.current = endpointKey;
    setBodyText(getBodyText(testSuite.requestTemplate?.body));
  }, [endpointKey, testSuite.requestTemplate?.body]);

  const onChangeActiveTab = useCallback((id: string) => {
    setActiveTab(id as EntityViewTab);
  }, []);

  const onAddRow = useCallback(() => {
    tabsContentRef.current?.add?.();
  }, []);

  const onChangeContentType = useCallback(
    (updatedTestSuite: TestSuite) => {
      setBodyText(getBodyText(updatedTestSuite.requestTemplate?.body));
      onChangeTestSuite(updatedTestSuite);
    },
    [onChangeTestSuite],
  );

  const body = testSuite.requestTemplate?.body;
  const isJsonataMode = body?.jsonataContent != null;
  const showJsonataToggle = body?.contentType === ContentType.JSON || isJsonataMode;
  const isEndpointConfigured = !!testSuite.endpointRef?.method && !!testSuite.endpointRef?.relativeUrlPattern;

  const isBodyFormData = activeTab === EntityViewTab.Body && !isJsonataMode && body?.contentType !== ContentType.JSON;

  const showAddButton =
    isEndpointConfigured &&
    (activeTab === EntityViewTab.Parameters || activeTab === EntityViewTab.Headers || isBodyFormData);
  const showVariablesDoc = isEndpointConfigured && activeTab === EntityViewTab.Body && !isBodyFormData;

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <div className="flex flex-row justify-between items-start mb-3">
        <h3>{t(TestSuitesI18nKey.RequestTemplate)}</h3>
        {isEndpointConfigured && (
          <div className="flex flex-row items-center gap-4">
            {showJsonataToggle && (
              <JsonataToggle testSuite={testSuite} bodyText={bodyText} onChangeTestSuite={onChangeTestSuite} />
            )}
            <ContentTypeSelect testSuite={testSuite} onChangeTestSuite={onChangeContentType} />
          </div>
        )}
      </div>

      {isEndpointConfigured ? (
        <>
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
            bodyText={bodyText}
            onChangeBodyText={setBodyText}
            onChange={onChangeTestSuite}
            jsonataVariables={jsonataVariables}
          />
        </>
      ) : (
        <div className="flex-1 min-h-[350px] flex items-center justify-center">
          <DialNoDataContent
            title={t(TestSuitesI18nKey.ConfigureEndpointFirst)}
            description={t(TestSuitesI18nKey.ConfigureEndpointFirstDescription)}
          />
        </div>
      )}
    </div>
  );
};

export default RequestTemplate;
