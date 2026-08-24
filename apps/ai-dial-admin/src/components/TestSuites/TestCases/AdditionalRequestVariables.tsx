'use client';

import { FC, useCallback, useMemo } from 'react';

import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { getTemplateParameterVariables } from '@/src/components/TestSuites/utils/request-template-params';
import { generateInputBindingsRowData } from '@/src/components/TestSuites/utils/template-variables';
import { useInputBindingHandlers } from '@/src/components/TestSuites/TestCases/use-input-binding-handlers';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { fromRequestView, getRequestLabel, toRequestView } from '@/src/utils/evaluation/request-chain';
import { InputBinding, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite: TestSuite;
  requestIndex: number;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  schema?: TestCaseSchema[];
}

const AdditionalRequestVariables: FC<Props> = ({ selectedTestSuite, requestIndex, onChange, schema }) => {
  const t = useI18n();
  const request = selectedTestSuite.additionalRequests?.[requestIndex - 1];

  const variables = useMemo(() => getTemplateParameterVariables(request?.requestTemplate), [request?.requestTemplate]);

  const rows = useMemo(
    () => generateInputBindingsRowData(variables, request?.inputBindings || []),
    [variables, request?.inputBindings],
  );

  const onBuildUpdatedTestSuite = useCallback(
    (suite: TestSuite, inputBindings: InputBinding[]) => {
      const view = toRequestView(suite, requestIndex);
      return fromRequestView(suite, requestIndex, { ...view, inputBindings });
    },
    [requestIndex],
  );

  const { onChangeValue, onChangeType, onChangeDataField } = useInputBindingHandlers({
    bindings: request?.inputBindings || [],
    selectedTestSuite,
    onChange,
    onBuildUpdatedTestSuite,
  });

  const sectionTitle = getRequestLabel(selectedTestSuite, requestIndex, t(TestSuitesI18nKey.Request));

  return (
    <DynamicConfiguration
      testSuiteId={selectedTestSuite.id as string}
      rows={rows}
      schema={schema}
      showTypeSelector
      title={`${t(TestSuitesI18nKey.DynamicConfiguration)} — ${sectionTitle}`}
      containerClassName={STANDARD_CONTROL_WIDTH}
      contentClassName="max-h-[350px] overflow-y-auto"
      onChangeValue={onChangeValue}
      onChangeType={onChangeType}
      onChangeDataField={onChangeDataField}
    />
  );
};

export default AdditionalRequestVariables;
