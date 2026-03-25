'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { getMetricBindingsColumns } from '@/src/components/TestSuites/utils/columns';
import {
  createUpdatedMetricBinding,
  generateMetricBindingsRowData,
} from '@/src/components/TestSuites/utils/metric-bindings';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedMetric: Metric;
  selectedTestSuite: TestSuite;
  onChange: (metric: Metric) => void;
}

const BindingsConfiguration: FC<Props> = ({ selectedMetric, selectedTestSuite, onChange }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);

  const selectedMetricConfigSchema = useMemo(() => {
    return jsonSchemaToFields(
      selectedMetric?.metricDeclarationVersion?.configSchema,
      selectedMetric?.metricDeclarationVersion?.configSchema,
    );
  }, [selectedMetric?.metricDeclarationVersion?.configSchema]);

  const selectedMetricInputSchema = useMemo(() => {
    return jsonSchemaToFields(
      selectedMetric?.metricDeclarationVersion?.inputSchema,
      selectedMetric?.metricDeclarationVersion?.inputSchema,
    );
  }, [selectedMetric?.metricDeclarationVersion?.inputSchema]);

  const bindingsRef = useRef<MetricBinding[]>([
    ...(selectedMetric.configBindings || []),
    ...(selectedMetric.inputBindings || []),
  ]);
  const onChangeRef = useRef(onChange);
  const selectedMetricRef = useRef(selectedMetric);

  useEffect(() => {
    onChangeRef.current = onChange;
    selectedMetricRef.current = selectedMetric;
    bindingsRef.current = [...(selectedMetric.configBindings || []), ...(selectedMetric.inputBindings || [])];
  }, [onChange, selectedMetric]);

  const onChangeParam = useCallback(
    (value: string | object, data: MetricBinding, field: string, _index?: number) => {
      const schemaField =
        selectedMetricConfigSchema.find((s) => s.name === data.property) ??
        selectedMetricInputSchema.find((s) => s.name === data.property);
      const isConfig = !!selectedMetricConfigSchema.find((s) => s.name === data.property);
      const isInput = !!selectedMetricInputSchema.find((s) => s.name === data.property);
      const newData = createUpdatedMetricBinding(value, data, field);
      const isTypeOrColumnChanged = field === 'source.$type' || newData.source.value === void 0;
      const isConstantEnumChanged =
        !isTypeOrColumnChanged && newData.source.value !== undefined && schemaField?.enum?.length;
      const skipRefresh = !isTypeOrColumnChanged && !isConstantEnumChanged;
      setIsSkipRefresh(skipRefresh);

      if (isConfig) {
        const index = selectedMetricRef.current.configBindings?.findIndex((b) => b.property === data.property);
        if (selectedMetricRef.current.configBindings) {
          const configBindings = [...selectedMetricRef.current.configBindings];
          if (index !== undefined && index !== -1) {
            configBindings.splice(index, 1, newData);
          } else {
            configBindings.push(newData);
          }
          onChangeRef.current({ ...selectedMetricRef.current, configBindings });
        }
      }
      if (isInput) {
        const index = selectedMetricRef.current.inputBindings?.findIndex((b) => b.property === data.property);
        if (selectedMetricRef.current.inputBindings) {
          const inputBindings = [...selectedMetricRef.current.inputBindings];
          if (index !== undefined && index !== -1) {
            inputBindings.splice(index, 1, newData);
          } else {
            inputBindings.push(newData);
          }
          onChangeRef.current({ ...selectedMetricRef.current, inputBindings });
        }
      }
    },
    [selectedMetricConfigSchema, selectedMetricInputSchema],
  );

  const columns = useMemo(() => {
    return [
      ...getMetricBindingsColumns(
        onChangeParam,
        selectedMetricConfigSchema,
        selectedMetricInputSchema,
        selectedTestSuite.testCaseSchema?.map((s) => s.name) || [],
        selectedTestSuite.responseColumns?.map((s) => s.name) || [],
        t,
      ),
    ];
  }, [
    onChangeParam,
    selectedMetricConfigSchema,
    selectedMetricInputSchema,
    selectedTestSuite.responseColumns,
    selectedTestSuite.testCaseSchema,
    t,
  ]);

  const data = useMemo(
    () =>
      generateMetricBindingsRowData(
        selectedMetric.configBindings || [],
        selectedMetric.inputBindings || [],
        selectedMetricConfigSchema,
        selectedMetricInputSchema,
      ),
    [selectedMetric.configBindings, selectedMetric.inputBindings, selectedMetricConfigSchema, selectedMetricInputSchema],
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
    <div className="flex flex-col gap-y-4 flex-1 min-h-0">
      <h3 className="text-secondary">{t(TestSuitesI18nKey.Bindings)}</h3>
      <div className="flex-1 min-h-0">
        <GridView
          getIsEmptyData={() => !data.length}
          emptyDataProps={{ title: t(BasicI18nKey.NoVariables) }}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default BindingsConfiguration;
