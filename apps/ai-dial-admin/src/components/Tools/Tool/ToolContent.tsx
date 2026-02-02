import { FC, useMemo } from 'react';

import { ColDef } from 'ag-grid-community';

import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { convertSchemaToTable, formatRequired } from '@/src/components/Tools/utils';
import TableView from '@/src/components/Tools/View/TableView';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import { ParamsView } from '@/src/types/parameters';

interface Props {
  tool: ToolType;
  view: string;
}

const TOOL_ANNOTATION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Annotation', floatingFilter: false, filter: false, sortable: false },
  { field: 'value', headerName: 'Value', floatingFilter: false, filter: false, sortable: false },
];

const ToolContent: FC<Props> = ({ tool, view }) => {
  const t = useI18n();
  const SCHEMA_COLUMNS: ColDef[] = useMemo(() => {
    return [
      { field: 'field', headerName: 'Field', floatingFilter: false, filter: false, sortable: false },
      { field: 'description', headerName: 'Description', floatingFilter: false, filter: false, sortable: false },
      { field: 'type', headerName: 'Type', floatingFilter: false, filter: false, sortable: false },
      {
        field: 'required',
        headerName: 'Required',
        floatingFilter: false,
        filter: false,
        sortable: false,
        cellDataType: false,
        valueFormatter: ({ value }) => formatRequired(value, t),
        tooltipValueGetter: ({ value }) => formatRequired(value, t),
      },
    ];
  }, [t]);

  const annotations = useMemo(() => {
    return tool.annotations
      ? Object.entries(tool.annotations).map(([name, value]) => ({
          name,
          value: String(value),
        }))
      : [];
  }, [tool.annotations]);

  const inputSchema = useMemo(() => {
    return convertSchemaToTable(tool.inputSchema);
  }, [tool.inputSchema]);

  const outputSchema = useMemo(() => {
    return convertSchemaToTable(tool.outputSchema);
  }, [tool.outputSchema]);

  return (
    <div className="flex flex-col mt-4 gap-4">
      {tool.description && <p className="body">{tool.description}</p>}
      {view === ParamsView.TABLE ? (
        <>
          {!!inputSchema.length && (
            <TableView title={t(ContainersI18nKey.InputSchema)} columnDefs={SCHEMA_COLUMNS} rowData={inputSchema} />
          )}
          {tool.annotations && (
            <TableView
              title={t(ContainersI18nKey.Annotations)}
              columnDefs={TOOL_ANNOTATION_COLUMNS}
              rowData={annotations}
            />
          )}
          {!!outputSchema.length && (
            <TableView title={t(ContainersI18nKey.InputSchema)} columnDefs={SCHEMA_COLUMNS} rowData={outputSchema} />
          )}
        </>
      ) : (
        <div className="flex h-[400px]">
          <JsonEditor entity={tool} options={{ stickyScroll: { enabled: false } }} readonly={true} />
        </div>
      )}
    </div>
  );
};

export default ToolContent;
