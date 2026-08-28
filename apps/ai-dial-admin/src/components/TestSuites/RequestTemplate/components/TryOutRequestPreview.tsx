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
import { toRequestView } from '@/src/utils/evaluation/request-chain';
import {
  getRequestTurnCounts,
  getTryOutSectionShape,
  shouldShowTurnLabels,
  TryOutSectionGroup,
} from '@/src/utils/evaluation/tryout-sections';
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
  selectedRequestIndex?: number;
  onLoadingChange?: (loading: boolean) => void;
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
  selectedRequestIndex = 0,
  onLoadingChange,
}) => {
  const t = useI18n();
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [testCase, setTestCase] = useState<TestCase | null>(initialTestCase ?? null);
  const [isVariablesLoading, setIsVariablesLoading] = useState(true);

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

  useEffect(() => {
    onLoadingChange?.(isVariablesLoading);
  }, [isVariablesLoading, onLoadingChange]);

  const perTurnFields = useMemo(() => perTurnFieldNames(schema), [schema]);
  const multiTurnData = testCase?.multiTurnData;
  const multiTurnLength = multiTurnData?.length ?? 0;

  const turnCounts = useMemo(
    () => (testCaseId ? getRequestTurnCounts(testSuite, schema, multiTurnLength) : [1]),
    [testCaseId, testSuite, schema, multiTurnLength],
  );

  const shape = useMemo(() => getTryOutSectionShape(turnCounts), [turnCounts]);

  const groupedSlots = useMemo((): TryOutSectionGroup<{ variables: TemplateVariable[] }>[] => {
    if (!testCaseId || shape === 'single') {
      return [];
    }

    const groups: TryOutSectionGroup<{ variables: TemplateVariable[] }>[] = [];

    for (let requestIndex = 0; requestIndex < turnCounts.length; requestIndex++) {
      const turnCount = turnCounts[requestIndex];
      const bindings = toRequestView(testSuite, requestIndex).inputBindings || [];
      const turns: TryOutSectionGroup<{ variables: TemplateVariable[] }>['turns'] = [];

      for (let turnIndex = 0; turnIndex < turnCount; turnIndex++) {
        const turnData = turnCount > 1 && multiTurnData ? multiTurnData[turnIndex] : (multiTurnData?.[0] ?? {});
        const effectiveData = buildTurnEffectiveData(testCase?.data, turnData, perTurnFields);
        turns.push({
          turnIndex,
          item: { variables: resolveVariablesForTurn(variables, bindings, effectiveData) },
        });
      }

      if (turns.length > 0) {
        groups.push({ requestIndex, turns });
      }
    }

    return groups;
  }, [testCaseId, shape, turnCounts, testSuite, multiTurnData, testCase?.data, perTurnFields, variables]);

  const isMcp = testSuite.suiteType === SuiteType.McpTool;
  const previewLabel = isMcp ? t(TestSuitesI18nKey.ToolArgumentsPreview) : t(TestSuitesI18nKey.RequestBodyPreview);
  const previewDescription = isMcp
    ? `TOOL CALL ${testSuite.mcpDeploymentRef?.name}:${testSuite.toolRef?.name}`
    : `${testSuite.endpointRef?.method} ${testSuite.endpointRef?.relativeUrlPattern}`;

  const renderVariables = (vars: TemplateVariable[], key: string, title?: string) => (
    <div key={key} className="flex flex-col gap-y-4 shrink-0">
      {title ? <h2 className="dial-small-text font-semibold">{title}</h2> : null}
      <Variables
        testSuiteId={testSuite.id as string}
        variables={vars}
        requestBody={{}}
        onChangeRequestBody={onChangeRequestBody}
        readonly
      />
    </div>
  );

  const sectionedVariables = (() => {
    if (shape === 'single' || groupedSlots.length === 0) {
      return (
        <Variables
          testSuiteId={testSuite.id as string}
          variables={variables}
          requestBody={requestBody}
          onChangeRequestBody={onChangeRequestBody}
          readonly={!!testCaseId}
        />
      );
    }

    if (shape === 'turns') {
      return groupedSlots.flatMap((group) =>
        group.turns.map(({ turnIndex, item }) =>
          renderVariables(item.variables, `t-${turnIndex}`, t(TestSuitesI18nKey.TurnLabel, { index: turnIndex + 1 })),
        ),
      );
    }

    if (shape === 'requests' || shape === 'combined') {
      const group = groupedSlots.find((item) => item.requestIndex === selectedRequestIndex);
      if (!group) {
        return null;
      }

      const showTurnLabels = shouldShowTurnLabels(group, turnCounts);

      return group.turns.map(({ turnIndex, item }) =>
        renderVariables(
          item.variables,
          `${shape}-${group.requestIndex}-${turnIndex}`,
          showTurnLabels ? t(TestSuitesI18nKey.TurnLabel, { index: turnIndex + 1 }) : undefined,
        ),
      );
    }

    return null;
  })();

  return isVariablesLoading || isRequestSend ? (
    <DialLoader size={40} />
  ) : (
    <>
      {sectionedVariables}

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
