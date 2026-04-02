'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, FirstDataRenderedEvent, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';

const MCP_DEPLOYMENTS_COLUMNS: ColDef[] = [
  { field: 'displayName', headerName: 'Display Name', hide: false },
  { field: 'deploymentId', headerName: 'ID', hide: false },
  { field: '$type', headerName: 'Type', hide: false },
  { field: 'transport', headerName: 'Transport', hide: false },
  { field: 'createdAt', headerName: 'Created At', hide: false },
];

interface Props {
  initialDeploymentId?: string;
  onSelect: (deployment: Deployment) => void;
}

const McpTargets: FC<Props> = ({ initialDeploymentId, onSelect }) => {
  const t = useI18n();
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);

  useEffect(() => {
    getDeployments(undefined, 'mcp').then((res) => {
      if (res?.success) {
        setDeployments(res.response || []);
      }
    });
  }, []);

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
        cellRenderer: (data: { data?: { deploymentId: string }; deploymentId: string }) => (
          <RadioButtonRenderer
            inputId={data.data?.deploymentId || data.deploymentId}
            isChecked={data.data?.deploymentId === initialDeploymentId}
          />
        ),
      },
      onRowSelected,
      onFirstDataRendered: (event: FirstDataRenderedEvent) => {
        if (initialDeploymentId) {
          event.api.forEachNode((node) => {
            if (node.data?.deploymentId === initialDeploymentId) {
              node.setSelected(true);
              event.api.ensureNodeVisible(node, 'middle');
            }
          });
        }
      },
    }),
    [initialDeploymentId, onRowSelected],
  );

  if (deployments == null) {
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
          columnDefs={MCP_DEPLOYMENTS_COLUMNS}
          rowData={deployments}
          additionalGridOptions={additionalGridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoApplications) }}
        />
      </div>
    </div>
  );
};

export default McpTargets;
