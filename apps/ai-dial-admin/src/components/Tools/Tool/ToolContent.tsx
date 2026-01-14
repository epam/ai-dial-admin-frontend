import { FC } from 'react';

import { ColDef } from 'ag-grid-community';

import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import Grid from '@/src/components/Grid/Grid';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Tool as ToolType } from '@/src/models/dial/toolset';

interface Props {
  tool: ToolType;
}

const TOOL_ANNOTATION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Annotation', floatingFilter: false, filter: false, sortable: false },
  { field: 'value', headerName: 'Value', floatingFilter: false, filter: false, sortable: false },
];

const ToolContent: FC<Props> = ({ tool }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col mt-4 gap-4">
      {tool.description && <p className="body">{tool.description}</p>}
      {tool.inputSchema && (
        <div className="flex flex-col">
          <div className="flex flex-row justify-between  mb-2">
            <p className="small text-secondary">{t(ContainersI18nKey.InputSchema)}</p>
          </div>
          <div className="flex h-[400px]">
            <JsonEditor entity={tool.inputSchema.properties} readonly={true} />
          </div>
        </div>
      )}
      {tool.annotations && (
        <div className="flex flex-col">
          <div className="flex flex-row justify-between mb-2">
            <p className="small text-secondary">{t(ContainersI18nKey.Annotations)}</p>
          </div>
          <Grid
            columnDefs={TOOL_ANNOTATION_COLUMNS}
            rowData={Object.entries(tool.annotations).map(([name, value]) => ({
              name,
              value: String(value),
            }))}
          />
        </div>
      )}
    </div>
  );
};

export default ToolContent;
