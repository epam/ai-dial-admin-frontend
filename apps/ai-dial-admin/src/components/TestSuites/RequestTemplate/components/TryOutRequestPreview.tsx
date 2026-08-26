'use client';
import { FC, useEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getDatasetTestCase } from '@/src/app/[lang]/datasets/actions';
import { getTestCaseTemplateVariables, getTestSuiteTemplateVariables } from '@/src/app/[lang]/test-suites/actions';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import {
  convertVariableIntoInitialRequest,
  perTurnFieldNames,
  buildTurnEffectiveData,
  resolveVariablesForTurn,
} from '@/src/components/TestSuites/utils/template-variables';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SuiteType, TemplateVariable, TestCase, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import Variables from './Variables';

interface Props {
  testSuite: TestSuite;
  testCaseId?: string;
  schema?: TestCaseSchema[];
  initialTestCase?: TestCase;
  resolvedRequest: Record<string, unknown>;
  isRequestSend?: boolean;
  requestBody: Record<string, unknown>;
  onChangeRequestBody: (body: Record<string, unknown>) => void;
}

const TryOutRequestPreview: FC<Props> = ({
  testSuite,
  testCaseId,
  schema,
  initialTestCase,
  resolvedRequest,
  isRequestSend,
  requestBody,
  onChangeRequestBody,
}) => {
  const t = useI18n();
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [testCase, setTestCase] = useState<TestCase | null>(initialTestCase ?? null);
  const [isVariablesLoading, setIsVariablesLoading] = useState(false);

  useEffect(() => {
    const fetchVariables = async () => {
      setIsVariablesLoading(true);
      try {
        const needsCaseFetch = !!testCaseId && !initialTestCase?.multiTurnData?.length;
        const [varsRes, caseRes] = await Promise.all([
          testCaseId
            ? getTestCaseTemplateVariables(testSuite.id || '', testCaseId)
            : getTestSuiteTemplateVariables(testSuite.id || ''),
          needsCaseFetch && testSuite.datasetId
            ? getDatasetTestCase(testSuite.datasetId, testCaseId)
            : Promise.resolve(null),
        ]);

        const vars = varsRes || [];
        setVariables(vars);
        if (caseRes) {
          setTestCase({
            id: caseRes.id || testCaseId || '',
            createdAt: caseRes.createdAt ?? 0,
            data: caseRes.data,
            multiTurnData: caseRes.multiTurnData,
          });
        } else if (initialTestCase) {
          setTestCase(initialTestCase);
        }
        // Test-case try-out posts an empty body; only suite-level Send uses these values.
        if (!testCaseId) {
          onChangeRequestBody(convertVariableIntoInitialRequest(vars));
        }
      } finally {
        setIsVariablesLoading(false);
      }
    };

    void fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const perTurnFields = useMemo(() => perTurnFieldNames(schema), [schema]);
  const multiTurnData = testCase?.multiTurnData;
  const isMultiTurn = !!testCaseId && (multiTurnData?.length ?? 0) > 1;

  const turnVariables = useMemo(() => {
    if (!isMultiTurn || !multiTurnData) {
      return null;
    }

    const bindings = testSuite.inputBindings || [];
    return multiTurnData.map((turnData) => {
      const effectiveData = buildTurnEffectiveData(testCase?.data, turnData, perTurnFields);
      return resolveVariablesForTurn(variables, bindings, effectiveData);
    });
  }, [isMultiTurn, multiTurnData, testCase?.data, testSuite.inputBindings, perTurnFields, variables]);

  const isMcp = testSuite.suiteType === SuiteType.McpTool;
  const previewLabel = isMcp ? t(TestSuitesI18nKey.ToolArgumentsPreview) : t(TestSuitesI18nKey.RequestBodyPreview);
  const previewDescription = isMcp
    ? `TOOL CALL ${testSuite.mcpDeploymentRef?.name}:${testSuite.toolRef?.name}`
    : `${testSuite.endpointRef?.method} ${testSuite.endpointRef?.relativeUrlPattern}`;

  return isVariablesLoading || isRequestSend ? (
    <DialLoader size={40} />
  ) : (
    <>
      {turnVariables ? (
        turnVariables.map((turnVars, index) => (
          <div key={index} className="flex flex-col gap-y-4 shrink-0">
            <h2 className="dial-small-text font-semibold">{t(TestSuitesI18nKey.TurnLabel, { index: index + 1 })}</h2>
            <Variables
              testSuiteId={testSuite.id as string}
              variables={turnVars}
              requestBody={{}}
              onChangeRequestBody={onChangeRequestBody}
              readonly
            />
          </div>
        ))
      ) : (
        <Variables
          testSuiteId={testSuite.id as string}
          variables={variables}
          requestBody={requestBody}
          onChangeRequestBody={onChangeRequestBody}
          readonly={!!testCaseId}
        />
      )}

      {Object.keys(resolvedRequest).length > 0 && (
        <div className="flex flex-col flex-1 min-h-0">
          <p className="dial-small-text mb-2">{previewLabel}</p>
          <p className="text-secondary mb-2 dial-small-text">{previewDescription}</p>
          <div className="flex-1 min-h-0">
            <JsonEditor
              entity={resolvedRequest}
              options={{ stickyScroll: { enabled: false }, wordWrap: 'bounded' }}
              readonly={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TryOutRequestPreview;
