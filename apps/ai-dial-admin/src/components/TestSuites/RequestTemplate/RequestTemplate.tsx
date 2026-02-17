'use client';

import { FC, useCallback, useState } from 'react';

import { DialTabs, DialTextInputField } from '@epam/ai-dial-ui-kit';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const RequestTemplate: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const tabs = getTestSuiteRequestTemplateTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Parameters);

  const onChangeActiveTab = useCallback((id: string) => {
    setActiveTab(id as EntityViewTab);
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-2">
      <div className="flex flex-row gap-2 items-center">
        {testSuite?.endpointRef?.method && (
          <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
            {testSuite?.endpointRef.method}
          </span>
        )}
        <DialTextInputField
          elementId="urlTemplate"
          value={testSuite.requestTemplate?.urlTemplate || ''}
          onChange={(urlTemplate) =>
            onChangeTestSuite({ ...testSuite, requestTemplate: { ...testSuite.requestTemplate, urlTemplate } })
          }
          containerClassName={STANDARD_CONTROL_WIDTH}
        />
      </div>
      <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
      <TabsContent activeTab={activeTab} selectedTestSuite={testSuite} onChange={onChangeTestSuite} />
    </div>
  );
};

export default RequestTemplate;
