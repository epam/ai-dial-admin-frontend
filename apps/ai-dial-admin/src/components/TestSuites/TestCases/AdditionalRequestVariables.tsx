'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import DynamicConfiguration from '@/src/components/TestSuites/Common/DynamicConfiguration/DynamicConfiguration';
import { getTemplateParameterVariables } from '@/src/components/TestSuites/utils/request-template-params';
import {
  generateInputBinding,
  generateInputBindingsRowData,
} from '@/src/components/TestSuites/utils/template-variables';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { fromRequestView, getRequestLabel, toRequestView } from '@/src/utils/evaluation/request-chain';
import { InputBinding, InputBindingRowData, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';

interface Props {
  selectedTestSuite: TestSuite;
  requestIndex: number;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  schema?: TestCaseSchema[];
}

const AdditionalRequestVariables: FC<Props> = ({ selectedTestSuite, requestIndex, onChange, schema }) => {
  const t = useI18n();
  const request = selectedTestSuite.additionalRequests?.[requestIndex - 1];

  const bindingsRef = useRef(request?.inputBindings || []);
  const onChangeRef = useRef(onChange);
  const selectedTestSuiteRef = useRef(selectedTestSuite);

  useEffect(() => {
    onChangeRef.current = onChange;
    selectedTestSuiteRef.current = selectedTestSuite;
    bindingsRef.current = request?.inputBindings || [];
  }, [onChange, selectedTestSuite, request?.inputBindings]);

  const variables = useMemo(() => getTemplateParameterVariables(request?.requestTemplate), [request?.requestTemplate]);

  const rows = useMemo(
    () => generateInputBindingsRowData(variables, request?.inputBindings || []),
    [variables, request?.inputBindings],
  );

  const emitChange = useCallback(
    (inputBindings: InputBinding[], isSkipRefresh?: boolean) => {
      const view = toRequestView(selectedTestSuiteRef.current, requestIndex);
      const updatedSuite = fromRequestView(selectedTestSuiteRef.current, requestIndex, { ...view, inputBindings });
      onChangeRef.current(updatedSuite, isSkipRefresh);
    },
    [requestIndex],
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
      emitChange(inputBindings, true);
    },
    [upsertBinding, emitChange],
  );

  const onChangeType = useCallback(
    (row: InputBindingRowData, type: InputBindingType) => {
      const inputBindings = upsertBinding(row.templateVariable, (b) =>
        generateInputBinding({ ...b, constantValue: void 0, dataField: void 0 }, 'type', type),
      );
      emitChange(inputBindings);
    },
    [upsertBinding, emitChange],
  );

  const onChangeDataField = useCallback(
    (row: InputBindingRowData, dataField: string) => {
      const inputBindings = upsertBinding(row.templateVariable, (b) => generateInputBinding(b, 'dataField', dataField));
      emitChange(inputBindings);
    },
    [upsertBinding, emitChange],
  );

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
