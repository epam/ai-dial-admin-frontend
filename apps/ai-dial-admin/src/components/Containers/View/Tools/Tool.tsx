import { FC, useCallback, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { Tool as ToolType } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ContainersI18nKey } from '@/src/constants/i18n';
import JsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import Grid from '@/src/components/Grid/Grid';

interface Props {
  tool: ToolType;
}

const TOOL_ANNOTATION_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Annotation', floatingFilter: false, filter: false, sortable: false },
  { field: 'value', headerName: 'Value', floatingFilter: false, filter: false, sortable: false },
];

const Tool: FC<Props> = ({ tool }) => {
  const t = useI18n();

  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col border-primary border p-4">
      <button className="flex items-center" onClick={toggleCollapse}>
        <i className="text-icon-secondary">
          {isCollapsed ? (
            <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
          ) : (
            <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
          )}
        </i>
        <h3 className="mx-2">{tool.name}</h3>
      </button>
      {!isCollapsed && (
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
      )}
    </div>
  );
};

export default Tool;
