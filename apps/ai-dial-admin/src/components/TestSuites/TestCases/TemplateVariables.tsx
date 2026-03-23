'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import { getTestSuiteTemplateVariables } from '@/src/app/[lang]/test-suites/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { getDynamicConfigurationsColumns } from '@/src/components/TestSuites/utils/columns';
import { generateInputBindingsRowData } from '@/src/components/TestSuites/utils/template-variables';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InputBindingRowData, TemplateVariable, TestSuite } from '@/src/models/evaluation/test-suite';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const TemplateVariables: FC<Props> = ({ selectedTestSuite, onChange, isSkipRefresh }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();
  const [variables, setVariables] = useState<TemplateVariable[]>([]);

  const bindingsRef = useRef(selectedTestSuite.inputBindings || []);
  const onChangeRef = useRef(onChange);
  const selectedTestSuiteRef = useRef(selectedTestSuite);

  useEffect(() => {
    onChangeRef.current = onChange;
    selectedTestSuiteRef.current = selectedTestSuite;
    bindingsRef.current = selectedTestSuite.inputBindings || [];
  }, [onChange, selectedTestSuite]);

  useEffect(() => {
    getTestSuiteTemplateVariables(selectedTestSuite.id as string).then((res) => {
      setVariables(res || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeParam = useCallback(
    (value: string | object, data: InputBindingRowData, _field: string, index?: number) => {
      const inputBindings = [...bindingsRef.current];
      const binding = { ...inputBindings[index as number] };

      binding.constantValue = value;
      binding.templateVariable = data.templateVariable;

      inputBindings.splice(index as number, 1, binding);
      onChangeRef.current(
        { ...selectedTestSuiteRef.current, inputBindings },
        !(data.effectiveType === TestCaseItemType.FILE),
      );
    },
    [],
  );

  const onChangeSelect = useCallback((value: string, data: InputBindingRowData, field: string, index?: number) => {
    const inputBindings = [...bindingsRef.current];
    const binding = { ...inputBindings[index as number] };
    if (field === 'type') {
      if (value === InputBindingType.Attribute) {
        binding.constantValue = void 0;
        binding.dataField = '';
      } else {
        binding.constantValue = '';
        binding.dataField = void 0;
      }
    } else {
      binding.dataField = value;
    }
    binding.templateVariable = data.templateVariable;

    inputBindings.splice(index as number, 1, binding);
    onChangeRef.current({ ...selectedTestSuiteRef.current, inputBindings });
  }, []);

  const columns = useMemo(() => {
    return [
      ...getDynamicConfigurationsColumns(onChangeParam, onChangeSelect, selectedTestSuite.testCaseSchema || [], t),
    ];
  }, [onChangeParam, onChangeSelect, selectedTestSuite.testCaseSchema, t]);

  const data = useMemo(
    () => generateInputBindingsRowData(variables || [], selectedTestSuite.inputBindings || []),
    [variables, selectedTestSuite.inputBindings],
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ columnDefs: columns });
    }
  }, [columns, gridApi]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ rowData: data });
    }
  }, [isSkipRefresh, data, gridApi]);

  return (
    <div className="flex flex-col gap-y-4 h-[250px]">
      <h1>{t(TestSuitesI18nKey.DynamicConfiguration)}</h1>
      <GridView
        getIsEmptyData={() => !data.length}
        emptyDataProps={{ title: t(BasicI18nKey.NoVariables) }}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default TemplateVariables;
