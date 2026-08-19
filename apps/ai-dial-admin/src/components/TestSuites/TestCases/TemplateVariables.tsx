'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getTestSuiteTemplateVariables } from '@/src/app/[lang]/test-suites/actions';
import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { useInputBindingHandlers } from '@/src/components/TestSuites/TestCases/use-input-binding-handlers';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { getRequestLabel } from '@/src/utils/evaluation/request-chain';
import { generateInputBindingsRowData } from '@/src/components/TestSuites/utils/template-variables';
import { InputBinding, TemplateVariable, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  schema?: TestCaseSchema[];
}

const TemplateVariables: FC<Props> = ({ selectedTestSuite, onChange, schema }) => {
  const t = useI18n();
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getTestSuiteTemplateVariables(selectedTestSuite.id as string)
      .then((res) => {
        setVariables(res || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () => generateInputBindingsRowData(variables || [], selectedTestSuite.inputBindings || []),
    [variables, selectedTestSuite.inputBindings],
  );

  const onBuildUpdatedTestSuite = useCallback(
    (suite: TestSuite, inputBindings: InputBinding[]) => ({ ...suite, inputBindings }),
    [],
  );

  const { onChangeValue, onChangeType, onChangeDataField } = useInputBindingHandlers({
    bindings: selectedTestSuite.inputBindings || [],
    selectedTestSuite,
    onChange,
    onBuildUpdatedTestSuite,
  });

  /** Only a chain needs the section named — a lone request has nothing to be told apart from. */
  const sectionTitle = selectedTestSuite.additionalRequests?.length
    ? `${t(TestSuitesI18nKey.DynamicConfiguration)} — ${getRequestLabel(selectedTestSuite, 0, t(TestSuitesI18nKey.Request))}`
    : undefined;

  return (
    <DynamicConfiguration
      testSuiteId={selectedTestSuite.id as string}
      rows={rows}
      schema={schema}
      showTypeSelector
      loading={isLoading}
      title={sectionTitle}
      containerClassName={STANDARD_CONTROL_WIDTH}
      contentClassName="max-h-[350px] overflow-y-auto"
      onChangeValue={onChangeValue}
      onChangeType={onChangeType}
      onChangeDataField={onChangeDataField}
    />
  );
};

export default TemplateVariables;
