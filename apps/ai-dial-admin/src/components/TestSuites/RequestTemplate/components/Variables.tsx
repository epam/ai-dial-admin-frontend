'use client';

import { FC, useCallback, useMemo } from 'react';

import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { generateVariablesRowData } from '@/src/components/TestSuites/utils/template-variables';
import { InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuiteId: string;
  variables: TemplateVariable[];
  requestBody: Record<string, unknown>;
  onChangeRequestBody: (requestBody: Record<string, unknown>) => void;
  readonly?: boolean;
}

const Variables: FC<Props> = ({ testSuiteId, variables, requestBody, onChangeRequestBody, readonly }) => {
  const rows = useMemo(() => generateVariablesRowData(variables || [], requestBody || {}), [variables, requestBody]);

  const onChangeValue = useCallback(
    (row: InputBindingRowData, value: unknown) => {
      onChangeRequestBody({ ...requestBody, [row.templateVariable]: value });
    },
    [onChangeRequestBody, requestBody],
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
