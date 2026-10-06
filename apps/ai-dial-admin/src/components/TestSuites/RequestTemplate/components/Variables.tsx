'use client';

import { FC, useCallback, useMemo } from 'react';

import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { generateVariablesRowData } from '@/src/components/TestSuites/utils/template-variables';
import { InputBindingRowData, TemplateVariable, TryOutVariablesByRequest } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuiteId: string;
  variables: TemplateVariable[];
  /** Which chain request this section belongs to, as the try-out payload keys it. */
  requestIndex: string;
  requestBody: TryOutVariablesByRequest;
  onChangeRequestBody: (requestBody: TryOutVariablesByRequest) => void;
  readonly?: boolean;
}

const Variables: FC<Props> = ({ testSuiteId, variables, requestIndex, requestBody, onChangeRequestBody, readonly }) => {
  const requestValues = useMemo(() => requestBody?.[requestIndex] ?? {}, [requestBody, requestIndex]);

  const rows = useMemo(() => generateVariablesRowData(variables || [], requestValues), [variables, requestValues]);

  const onChangeValue = useCallback(
    (row: InputBindingRowData, value: unknown) => {
      onChangeRequestBody({
        ...requestBody,
        [requestIndex]: { ...requestValues, [row.templateVariable]: value },
      });
    },
    [onChangeRequestBody, requestBody, requestIndex, requestValues],
  );

  return (
    <DynamicConfiguration
      testSuiteId={testSuiteId}
      rows={rows}
      showTypeSelector={false}
      readonly={readonly}
      onChangeValue={onChangeValue}
    />
  );
};

export default Variables;
