'use client';

import { useCallback, useEffect, useRef } from 'react';

import { generateInputBinding } from '@/src/components/TestSuites/utils/template-variables';
import { InputBinding, InputBindingRowData, TestSuite } from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';

interface Props {
  bindings: InputBinding[];
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  /** Builds the next test suite from the current one and the updated bindings — the one thing that
   *  differs between a single-request suite (spread onto the suite) and a chained request
   *  (written back through the request-view). */
  onBuildUpdatedTestSuite: (selectedTestSuite: TestSuite, bindings: InputBinding[]) => TestSuite;
}

interface Result {
  onChangeValue: (row: InputBindingRowData, value: unknown) => void;
  onChangeType: (row: InputBindingRowData, type: InputBindingType) => void;
  onChangeDataField: (row: InputBindingRowData, dataField: string) => void;
}

export const useInputBindingHandlers = ({
  bindings,
  selectedTestSuite,
  onChange,
  onBuildUpdatedTestSuite,
}: Props): Result => {
  const bindingsRef = useRef(bindings);
  const onChangeRef = useRef(onChange);
  const selectedTestSuiteRef = useRef(selectedTestSuite);
  const onBuildUpdatedTestSuiteRef = useRef(onBuildUpdatedTestSuite);

  useEffect(() => {
    onChangeRef.current = onChange;
    selectedTestSuiteRef.current = selectedTestSuite;
    bindingsRef.current = bindings;
    onBuildUpdatedTestSuiteRef.current = onBuildUpdatedTestSuite;
  }, [onChange, selectedTestSuite, bindings, onBuildUpdatedTestSuite]);

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

  const emitChange = useCallback((inputBindings: InputBinding[], isSkipRefresh?: boolean) => {
    const updatedSuite = onBuildUpdatedTestSuiteRef.current(selectedTestSuiteRef.current, inputBindings);
    onChangeRef.current(updatedSuite, isSkipRefresh);
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

  return { onChangeValue, onChangeType, onChangeDataField };
};
