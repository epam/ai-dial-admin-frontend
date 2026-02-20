'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialTabs, DialTextInputField } from '@epam/ai-dial-ui-kit';

import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getTestSuiteRequestTemplateTabs } from '@/src/utils/tabs/utils';
import { isContainRegexSymbols } from '@/src/utils/validation/path-error';
import TabsContent from './TabsContent';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const RequestTemplate: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const tabs = getTestSuiteRequestTemplateTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Body);

  const onChangeActiveTab = useCallback((id: string) => {
    setActiveTab(id as EntityViewTab);
  }, []);

  const urlTemplateError = useMemo(() => {
    const urlTemplate = testSuite.requestTemplate?.urlTemplate;
    const relativeUrlPattern = testSuite.endpointRef?.relativeUrlPattern;

    if (!urlTemplate || !relativeUrlPattern) {
      return undefined;
    }

    if (isContainRegexSymbols(relativeUrlPattern)) {
      try {
        const regex = new RegExp(relativeUrlPattern);

        if (!regex.test(urlTemplate)) {
          return `Not matches with ${relativeUrlPattern}`;
        }
      } catch (error) {
        console.error('Invalid regex pattern:', error);
      }
    }
    return undefined;
  }, [testSuite.endpointRef?.relativeUrlPattern, testSuite.requestTemplate?.urlTemplate]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'urlTemplate', isValid: !urlTemplateError });
  }, [dispatch, urlTemplateError]);

  return (
    <div className="flex flex-col w-full h-full gap-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-2 items-start">
          {testSuite?.endpointRef?.method && (
            <span className="tiny bg-layer-3 rounded p-1 mt-[7px] border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
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
            invalid={!!urlTemplateError}
            error={urlTemplateError}
          />
        </div>
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
      </div>
      <TabsContent activeTab={activeTab} selectedTestSuite={testSuite} onChange={onChangeTestSuite} />
    </div>
  );
};

export default RequestTemplate;
