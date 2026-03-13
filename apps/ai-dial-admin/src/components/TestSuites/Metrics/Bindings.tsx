'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import { jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { getMetricBindingsColumns } from '@/src/components/TestSuites/utils/columns';
import { generateMetricBindingsRowData } from '@/src/components/TestSuites/utils/metric-bindings';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';

interface Props {
  selectedMetric: Metric;
  onChange: (metric: Metric, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const Bindings: FC<Props> = ({ selectedMetric, onChange, isSkipRefresh }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi>();

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
    (_value: string | object, data: MetricBinding, _field: string, _index?: number) => {
      const isConfig = selectedMetricConfigSchema.find((s) => s.name === data.property);
      const isInput = selectedMetricInputSchema.find((s) => s.name === data.property);

      if (isConfig) {
        const index = selectedMetricRef.current.configBindings?.findIndex((b) => b.property === data.property);
        if (selectedMetricRef.current.configBindings) {
          const configBindings = [...selectedMetricRef.current.configBindings];
          if (index !== undefined && index !== -1) {
            configBindings.splice(index, 1, data);
          } else {
            configBindings.push(data);
          }
          onChangeRef.current(
            { ...selectedMetricRef.current, configBindings },
            !!(data.source.$type === MetricBindingType.Constant),
          );
        }
      }
      if (isInput) {
        const index = selectedMetricRef.current.inputBindings?.findIndex((b) => b.property === data.property);
        if (selectedMetricRef.current.inputBindings) {
          const inputBindings = [...selectedMetricRef.current.inputBindings];
          if (index !== undefined && index !== -1) {
            inputBindings.splice(index, 1, data);
          } else {
            inputBindings.push(data);
          }
          onChangeRef.current(
            { ...selectedMetricRef.current, inputBindings },
            !!(data.source.$type === MetricBindingType.Constant),
          );
        }
      }
    },
    [selectedMetricConfigSchema, selectedMetricInputSchema],
  );

  const columns = useMemo(() => {
    //add response columns and test case columns
    return [...getMetricBindingsColumns(onChangeParam, selectedMetricConfigSchema, [], [], t)];
  }, [onChangeParam, selectedMetricConfigSchema, t]);

  const data = useMemo(
    () =>
      generateMetricBindingsRowData(
        selectedMetric.configBindings || [],
        selectedMetric.inputBindings || [],
        selectedMetricConfigSchema,
        selectedMetricInputSchema,
      ),
    [
      selectedMetric.configBindings,
      selectedMetric.inputBindings,
      selectedMetricConfigSchema,
      selectedMetricInputSchema,
    ],
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
    <div className="flex flex-col gap-y-4 h-[650px]">
      <h1>{t(TestSuitesI18nKey.Bindings)}</h1>
      <GridView
        getIsEmptyData={() => !data.length}
        emptyDataProps={{ title: t(BasicI18nKey.NoVariables) }}
        onGridReady={onGridReady}
      />
    </div>
  );
};

export default Bindings;
