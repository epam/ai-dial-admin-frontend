'use client';

import { FC, useCallback, useMemo } from 'react';

import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { getTemplateParameterVariables } from '@/src/components/TestSuites/utils/request-template-params';
import { generateInputBindingsRowData } from '@/src/components/TestSuites/utils/template-variables';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { InputBinding, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { useAttributeSamples } from './use-attribute-samples';
import { useInputBindingHandlers } from './use-input-binding-handlers';

interface Props {
  testSuiteId?: string;
  datasetId?: string;
  requestView: TestSuite;
  onChangeRequestView: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  schema?: TestCaseSchema[];
  title?: string;
}

/**
 * Dynamic Configuration for whichever request the Method tab currently has selected. `requestView` is
 * already scoped to that request (via `toRequestView`), and `onChangeRequestView` already writes back
 * through the matching chain entry (via `fromRequestView`) — the same pair `RequestTemplate` and
 * `EndpointSchema` receive from `MethodTabContent`.
 */
const RequestDynamicConfiguration: FC<Props> = ({
  testSuiteId,
  datasetId,
  requestView,
  onChangeRequestView,
  schema,
  title,
}) => {
  // Loaded here rather than per row: one request serves every attribute dropdown in the tab.
  const samples = useAttributeSamples(datasetId, schema);

  const variables = useMemo(
    () => getTemplateParameterVariables(requestView.requestTemplate),
    [requestView.requestTemplate],
  );

  const rows = useMemo(
    () => generateInputBindingsRowData(variables, requestView.inputBindings || []),
    [variables, requestView.inputBindings],
  );

  const onBuildUpdatedTestSuite = useCallback(
    (suite: TestSuite, inputBindings: InputBinding[]) => ({ ...suite, inputBindings }),
    [],
  );

  const { onChangeValue, onChangeType, onChangeDataField } = useInputBindingHandlers({
    bindings: requestView.inputBindings || [],
    selectedTestSuite: requestView,
    onChange: onChangeRequestView,
    onBuildUpdatedTestSuite,
  });

  return (
    <DynamicConfiguration
      testSuiteId={testSuiteId}
      rows={rows}
      schema={schema}
      samples={samples}
      showTypeSelector
      title={title}
      collapsible={false}
      containerClassName={STANDARD_CONTROL_WIDTH}
      contentPaddingClassName="p-0"
      accordionContainerClassName="border-secondary"
      onChangeValue={onChangeValue}
      onChangeType={onChangeType}
      onChangeDataField={onChangeDataField}
    />
  );
};

export default RequestDynamicConfiguration;
