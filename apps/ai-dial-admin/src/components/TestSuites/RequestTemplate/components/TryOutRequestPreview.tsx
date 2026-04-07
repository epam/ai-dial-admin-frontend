'use client';
import { FC, useEffect, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseTemplateVariables, getTestSuiteTemplateVariables } from '@/src/app/[lang]/test-suites/actions';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { convertVariableIntoInitialRequest } from '@/src/components/TestSuites/utils/template-variables';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SuiteType, TemplateVariable, TestSuite } from '@/src/models/evaluation/test-suite';
import Variables from './Variables';

interface Props {
  testSuite: TestSuite;
  testCaseId?: string;
  resolvedRequest: Record<string, unknown>;
  isRequestSend?: boolean;
  requestBody: Record<string, unknown>;
  onChangeRequestBody: (body: Record<string, unknown>) => void;
}

const TryOutRequestPreview: FC<Props> = ({
  testSuite,
  testCaseId,
  resolvedRequest,
  isRequestSend,
  requestBody,
  onChangeRequestBody,
}) => {
  const t = useI18n();
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [isVariablesLoading, setIsVariablesLoading] = useState(false);

  useEffect(() => {
    const fetchVariables = async () => {
      setIsVariablesLoading(true);
      try {
        const res = testCaseId
          ? await getTestCaseTemplateVariables(testSuite.id || '', testCaseId || '')
          : await getTestSuiteTemplateVariables(testSuite.id || '');

        const vars = res || [];
        setVariables(vars);
        onChangeRequestBody(convertVariableIntoInitialRequest(vars));
      } finally {
        setIsVariablesLoading(false);
      }
    };

    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMcp = testSuite.suiteType === SuiteType.McpTool;
  const previewLabel = isMcp ? t(TestSuitesI18nKey.ToolArgumentsPreview) : t(TestSuitesI18nKey.RequestBodyPreview);
  const previewDescription = isMcp
    ? `TOOL CALL ${testSuite.mcpDeploymentRef?.name}:${testSuite.toolRef?.name}`
    : `${testSuite.endpointRef?.method} ${testSuite.endpointRef?.relativeUrlPattern}`;

  return isVariablesLoading || isRequestSend ? (
    <DialLoader size={40} />
  ) : (
    <>
      <div className="flex flex-col">
        <p className="dial-small-text mb-2">{t(TestSuitesI18nKey.DynamicConfiguration)}</p>
        <Variables
          testSuiteId={testSuite.id as string}
          variables={variables}
          requestBody={requestBody}
          onChangeRequestBody={onChangeRequestBody}
        />
      </div>

      <div className="flex flex-col">
        <p className="dial-small-text mb-2">{previewLabel}</p>
        <p className="text-secondary mb-2 dial-small-text">{previewDescription}</p>
        <div className="h-[300px]">
          <JsonEditor
            entity={resolvedRequest}
            options={{ stickyScroll: { enabled: false }, wordWrap: 'bounded' }}
            readonly={true}
          />
        </div>
      </div>
    </>
  );
};

export default TryOutRequestPreview;
