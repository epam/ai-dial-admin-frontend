'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTestSuiteTemplateVariables } from '@/src/app/[lang]/test-suites/actions';
import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import {
  generateInputBinding,
  generateInputBindingsRowData,
} from '@/src/components/TestSuites/utils/template-variables';
import {
  InputBinding,
  InputBindingRowData,
  TemplateVariable,
  TestCaseSchema,
  TestSuite,
} from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  schema?: TestCaseSchema[];
}

const TemplateVariables: FC<Props> = ({ selectedTestSuite, onChange, schema }) => {
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bindingsRef = useRef(selectedTestSuite.inputBindings || []);
  const onChangeRef = useRef(onChange);
  const selectedTestSuiteRef = useRef(selectedTestSuite);

  useEffect(() => {
    onChangeRef.current = onChange;
    selectedTestSuiteRef.current = selectedTestSuite;
    bindingsRef.current = selectedTestSuite.inputBindings || [];
  }, [onChange, selectedTestSuite]);

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

  const upsertBinding = useCallback((templateVariable: string, update: (binding: InputBinding) => InputBinding) => {
    const inputBindings = [...bindingsRef.current];
    const index = inputBindings.findIndex((b) => b.templateVariable === templateVariable);
    const base: InputBinding = index === -1 ? { templateVariable } : { ...inputBindings[index] };
    const updated = update(base);
    if (index === -1) {
      inputBindings.push(updated);
    } else {
      inputBindings.splice(index, 1, updated);
    }
    return inputBindings;
  }, []);

  const onChangeValue = useCallback(
    (row: InputBindingRowData, value: unknown) => {
      const inputBindings = upsertBinding(row.templateVariable, (b) => ({
        ...b,
        constantValue: value,
      }));
      onChangeRef.current({ ...selectedTestSuiteRef.current, inputBindings }, true);
    },
    [upsertBinding],
  );

  const onChangeType = useCallback(
    (row: InputBindingRowData, type: InputBindingType) => {
      const inputBindings = upsertBinding(row.templateVariable, (b) =>
        generateInputBinding({ ...b, constantValue: void 0, dataField: void 0 }, 'type', type),
      );
      onChangeRef.current({ ...selectedTestSuiteRef.current, inputBindings });
    },
    [upsertBinding],
  );

  const onChangeDataField = useCallback(
    (row: InputBindingRowData, dataField: string) => {
      const inputBindings = upsertBinding(row.templateVariable, (b) => generateInputBinding(b, 'dataField', dataField));
      onChangeRef.current({ ...selectedTestSuiteRef.current, inputBindings });
    },
    [upsertBinding],
  );

  return (
    <DynamicConfiguration
      testSuiteId={selectedTestSuite.id as string}
      rows={rows}
      schema={schema}
      showTypeSelector
      loading={isLoading}
      containerClassName={STANDARD_CONTROL_WIDTH}
      contentClassName="max-h-[350px] overflow-y-auto"
      onChangeValue={onChangeValue}
      onChangeType={onChangeType}
      onChangeDataField={onChangeDataField}
    />
  );
};

export default TemplateVariables;
