'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { OutlinedButton, Tabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import ParamsTab, { ParamsTabRef } from '@/src/components/TestSuites/RequestTemplate/tabs/ParamsTab';
import { parseBodyText } from '@/src/components/TryOut/Deployment/utils/to-try-out-request';
import { BasicI18nKey, ButtonsI18nKey, DeploymentTryOutI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { bodyTab, EntityViewTab, headersTab, parametersTab } from '@/src/utils/tabs/utils';

interface Props {
  template: TestSuiteRequestTemplate;
  onChangeTemplate: (template: TestSuiteRequestTemplate) => void;
  bodyText: string;
  isBodyValid: boolean;
  onChangeBody: (text: string) => void;
  onReset: () => void;
}

const EMPTY_BODY = {};

const AdvancedRequest: FC<Props> = ({ template, onChangeTemplate, bodyText, isBodyValid, onChangeBody, onReset }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState(EntityViewTab.Body);
  const paramsRef = useRef<ParamsTabRef>(null);

  const tabs = useMemo(() => [bodyTab(t), headersTab(t), parametersTab(t)], [t]);
  const parsedBody = parseBodyText(bodyText);
  const bodyEntity = parsedBody.isValid && parsedBody.value != null ? (parsedBody.value as object) : EMPTY_BODY;
  const isParamsTab = activeTab === EntityViewTab.Headers || activeTab === EntityViewTab.Parameters;

  const onChangeTab = useCallback((id: string) => setActiveTab(id as EntityViewTab), []);
  const onAddRow = useCallback(() => paramsRef.current?.add(), []);

  return (
    <div className="flex flex-col gap-y-3 min-h-0">
      <div className="flex flex-row justify-between items-start gap-x-3">
        <Tabs tabs={tabs} activeTabId={activeTab} onTabChange={onChangeTab} ariaLabel={t(TabsI18nKey.ListLabel)} />
        {isParamsTab ? (
          <OutlinedButton iconBefore={<IconPlus />} label={t(ButtonsI18nKey.Add)} onClick={onAddRow} />
        ) : (
          <OutlinedButton label={t(ButtonsI18nKey.Reset)} onClick={onReset} />
        )}
      </div>

      {activeTab === EntityViewTab.Body && (
        <>
          <div className="w-full h-[320px]">
            <JsonEditor entity={bodyEntity} text={bodyText} onChangeText={onChangeBody} />
          </div>
          {!isBodyValid && (
            <p role="alert" className="text-error dial-small-text">
              {t(DeploymentTryOutI18nKey.InvalidJson)}
            </p>
          )}
        </>
      )}
      {activeTab === EntityViewTab.Headers && (
        <div className="h-[320px]">
          <ParamsTab
            ref={paramsRef}
            template={template}
            changeTemplate={onChangeTemplate}
            field="headers"
            emptyDataTitle={t(BasicI18nKey.NoHeaders)}
          />
        </div>
      )}
      {activeTab === EntityViewTab.Parameters && (
        <div className="h-[320px]">
          <ParamsTab
            ref={paramsRef}
            template={template}
            changeTemplate={onChangeTemplate}
            field="queryParams"
            emptyDataTitle={t(BasicI18nKey.NoParameters)}
          />
        </div>
      )}
    </div>
  );
};

export default AdvancedRequest;
