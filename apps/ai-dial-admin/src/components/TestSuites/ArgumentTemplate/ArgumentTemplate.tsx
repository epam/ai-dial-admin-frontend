'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialSwitch } from '@epam/ai-dial-ui-kit';
import { GridOptions } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { getArgumentColumns } from '@/src/components/TestSuites/ArgumentTemplate/columns';
import {
  buildArgumentsFromTable,
  inferFieldMode,
  ArgumentRow,
} from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ArgumentTemplate as ArgumentTemplateModel, TestCaseSchema, ToolRef } from '@/src/models/evaluation/test-suite';

interface Props {
  toolRef: ToolRef;
  argumentTemplate: ArgumentTemplateModel;
  testCaseSchema?: TestCaseSchema[];
  onChange: (argumentTemplate: ArgumentTemplateModel) => void;
}

const ArgumentTemplate: FC<Props> = ({ toolRef, argumentTemplate, testCaseSchema, onChange }) => {
  const t = useI18n();
  const [isJsonMode, setIsJsonMode] = useState(false);

  const rows: ArgumentRow[] = useMemo(() => {
    const properties = (toolRef.inputSchema as { properties?: Record<string, { type?: string }> })?.properties;
    if (!properties) return [];

    return Object.entries(properties).map(([name, prop]) => {
      const value = argumentTemplate.arguments[name];
      const mode = prop.type === 'object' || prop.type === 'array' ? 'constant' : inferFieldMode(value);
      return {
        name,
        type: prop.type || 'string',
        mode,
        value,
      };
    });
  }, [toolRef.inputSchema, argumentTemplate.arguments]);

  const onRowChange = useCallback(
    (updatedRows: ArgumentRow[]) => {
      onChange({ arguments: buildArgumentsFromTable(updatedRows) });
    },
    [onChange],
  );

  const onJsonChange = useCallback(
    (value: ArgumentTemplateModel) => {
      onChange(value);
    },
    [onChange],
  );

  const onToggleJsonMode = useCallback(() => {
    setIsJsonMode((prev) => !prev);
  }, []);

  const requiredFields = useMemo(() => {
    const required = (toolRef.inputSchema as { required?: string[] })?.required;
    return new Set(required || []);
  }, [toolRef.inputSchema]);

  const columnDefs = useMemo(
    () => getArgumentColumns(toolRef, testCaseSchema || [], requiredFields, rows, onRowChange),
    [toolRef, testCaseSchema, requiredFields, rows, onRowChange],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      domLayout: 'autoHeight',
    }),
    [],
  );

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <div className="flex flex-row justify-between items-center mb-3">
        <h3>{t(TestSuitesI18nKey.ToolArguments)}</h3>
        <DialSwitch switchId="jsonEditor" isOn={isJsonMode} onChange={onToggleJsonMode} label="JSON" />
      </div>

      {isJsonMode ? (
        <div className="h-[300px]">
          <EntityJsonEditor
            entity={argumentTemplate}
            setSelectedEntity={onJsonChange as (value: ArgumentTemplateModel) => void}
          />
        </div>
      ) : rows.length > 0 ? (
        <div className="flex-1 min-h-0">
          <GridView
            columnDefs={columnDefs}
            rowData={rows}
            additionalGridOptions={additionalGridOptions}
            emptyDataProps={{ title: t(TestSuitesI18nKey.NoArgumentsDefined) }}
          />
        </div>
      ) : (
        <p className="text-secondary dial-small-text">{t(TestSuitesI18nKey.NoArgumentsDefined)}</p>
      )}
    </div>
  );
};

export default ArgumentTemplate;
