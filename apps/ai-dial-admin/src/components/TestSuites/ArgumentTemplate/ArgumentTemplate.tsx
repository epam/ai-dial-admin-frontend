'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { getArgumentColumns } from '@/src/components/TestSuites/ArgumentTemplate/columns';
import { ArgumentRow } from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ArgumentTemplate as ArgumentTemplateModel, ToolRef } from '@/src/models/evaluation/test-suite';

interface Props {
  toolRef: ToolRef;
  argumentTemplate: ArgumentTemplateModel;
  onChange: (argumentTemplate: ArgumentTemplateModel, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const ArgumentTemplate: FC<Props> = ({ toolRef, argumentTemplate, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();

  const argumentsRef = useRef(argumentTemplate.arguments);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
    argumentsRef.current = argumentTemplate.arguments;
  }, [onChange, argumentTemplate.arguments]);

  const rows: ArgumentRow[] = useMemo(() => {
    const properties = (toolRef.inputSchema as { properties?: Record<string, { type?: string }> })?.properties;
    if (!properties) return [];

    return Object.entries(properties).map(([name, prop]) => ({
      name,
      type: prop.type || 'string',
      value: argumentTemplate.arguments[name],
    }));
  }, [toolRef.inputSchema, argumentTemplate.arguments]);

  // CRITICAL: mutate row data IN PLACE so ag-grid sees no change and keeps focus
  const onCellChange = useCallback((name: string, value: string) => {
    const args = { ...argumentsRef.current, [name]: value };
    argumentsRef.current = args;
    onChangeRef.current({ arguments: args }, true);
  }, []);

  const requiredFields = useMemo(() => {
    const required = (toolRef.inputSchema as { required?: string[] })?.required;
    return new Set(required || []);
  }, [toolRef.inputSchema]);

  const columnDefs = useMemo(
    () => getArgumentColumns(toolRef, requiredFields, onCellChange),
    [toolRef, requiredFields, onCellChange],
  );

  const rowData = useMemo(() => rows, [rows]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      event.api?.updateGridOptions({ columnDefs, rowData });
    },
    [columnDefs, rowData],
  );

  useEffect(() => {
    if (!gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ columnDefs });
    }
  }, [columnDefs, gridApi]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({ rowData });
    }
  }, [isSkipRefresh, rowData, gridApi]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
        <h3>{t(TestSuitesI18nKey.ToolArguments)}</h3>
        <p className="text-secondary dial-small-text">{t(TestSuitesI18nKey.NoArgumentsDefined)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <h3>{t(TestSuitesI18nKey.ToolArguments)}</h3>
      <div className="min-h-0 overflow-auto" style={{ maxHeight: '300px' }}>
        <GridView<ArgumentRow>
          getIsEmptyData={() => rows.length === 0}
          emptyDataProps={{ title: t(TestSuitesI18nKey.NoArgumentsDefined) }}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default ArgumentTemplate;
