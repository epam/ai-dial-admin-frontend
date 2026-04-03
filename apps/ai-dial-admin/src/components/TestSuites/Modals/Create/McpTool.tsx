'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { getDeploymentTools } from '@/src/app/[lang]/test-suites/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolDefinition } from '@/src/models/evaluation/deployment';

const TOOL_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Tool Name', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  {
    field: 'inputSchemaFieldCount',
    headerName: 'Input Schema Fields',
    hide: false,
    valueGetter: (params) => {
      const schema = params.data?.inputSchema;
      if (schema?.properties) {
        return Object.keys(schema.properties).length;
      }
      return 0;
    },
  },
];

interface Props {
  deploymentId: string;
  initialToolName?: string;
  onSelect: (tool: ToolDefinition) => void;
}

const McpTool: FC<Props> = ({ deploymentId, initialToolName, onSelect }) => {
  const t = useI18n();
  const [tools, setTools] = useState<ToolDefinition[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setTools(null);
    setError(false);
    getDeploymentTools(deploymentId).then((res) => {
      if (res) {
        setTools(res);
      } else {
        setError(true);
        setTools([]);
      }
    });
  }, [deploymentId]);

  const onRowSelected = useCallback(
    (event: RowSelectedEvent) => {
      if (event.node.isSelected() && event.data) {
        onSelect(event.data);
      }
    },
    [onSelect],
  );

  const additionalGridOptions: GridOptions = useMemo(
    () => ({
      ...SINGLE_ROW_SELECTION,
      selectionColumnDef: {
        ...SINGLE_ROW_SELECTION.selectionColumnDef,
        cellRenderer: (data: { data?: { name: string }; name: string }) => (
          <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.name === initialToolName} />
        ),
      },
      onRowSelected,
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        if (initialToolName) {
          event.api.forEachNode((node) => {
            if (node.data?.name === initialToolName) {
              node.setSelected(true);
              event.api.ensureNodeVisible(node, 'middle');
            }
          });
        }
      },
    }),
    [initialToolName, onRowSelected],
  );

  if (tools == null) {
    return (
      <div className="size-full flex flex-col">
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col">
      <div className="flex-1 min-h-0">
        <GridView
          columnDefs={TOOL_COLUMNS}
          rowData={tools}
          additionalGridOptions={additionalGridOptions}
          emptyDataProps={{
            title: error ? t(TestSuitesI18nKey.FailedToLoadTools) : t(TestSuitesI18nKey.NoToolsAvailable),
          }}
        />
      </div>
    </div>
  );
};

export default McpTool;
