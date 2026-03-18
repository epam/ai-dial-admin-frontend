'use client';

import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { isEqual } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getMcpServers } from '@/src/app/actions/deployments';
import { infiniteGridOptions, SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { MCP_REGISTRY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { FilterDto } from '@/src/models/request';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { isServerSelectable } from '@/src/utils/deployments/mcp-registry';
import { McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import ListEntities from '@/src/components/ListView/List';

interface Props {
  selectedServer?: McpServer;
  onSelect: (server: McpServer) => void;
}

const McpRegistryGrid: FC<Props> = ({ selectedServer, onSelect }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: McpServer }) => (
        <RadioButtonRenderer inputId={data.data?.name as string} isChecked={data.data?.name === selectedServer?.name} />
      ),
    },
    isRowSelectable: (node) => isServerSelectable(node.data),
    onRowSelected: (event) => {
      if (event.node.isSelected() && event.data) {
        onSelect(event.data);
      }
    },
    getRowStyle: (params) => {
      if (params.data && !isServerSelectable(params.data)) {
        return { opacity: '0.5' };
      }
      return undefined;
    },
  };

  const gridDataSource: IDatasource = useMemo(() => {
    let nextCursor = '';
    let filters: FilterDto[] = [];
    return {
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const currentFilters = getRequestFilters(params.filterModel);
        if (!isEqual(filters, currentFilters)) {
          nextCursor = '';
        }
        filters = currentFilters;

        const requestFilters = Object.fromEntries(
          currentFilters.map(({ column, value }) => [column === 'name' ? 'search' : column, encodeURIComponent(value)]),
        );

        getMcpServers({
          cursor: nextCursor,
          limit: '100',
          ...requestFilters,
        })
          .then(({ response, success }) => {
            if (success) {
              const REGISTRY_META_KEY = 'io.modelcontextprotocol.registry/official';
              const servers = (response.servers || []).map((s: McpServerResponse) => ({
                ...s.server,
                updatedAt: (s._meta?.[REGISTRY_META_KEY] as Record<string, unknown>)?.updatedAt,
              }));
              if (servers.length === 0) {
                params.successCallback([], 0);
              } else {
                nextCursor = response.metadata?.nextCursor || '';
                params.successCallback(servers, nextCursor ? undefined : params.startRow + servers.length);
              }
            } else {
              params.failCallback();
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    };
  }, [gridApi]);

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  return (
    <ListEntities
      columnDefs={MCP_REGISTRY_COLUMNS}
      listLabel={t(ContainersI18nKey.McpServers)}
      emptyDataProps={{ title: t(ContainersI18nKey.McpServers) }}
      storageKey="mcp-registry"
      additionalGridOptions={gridOptions}
      onGridReady={onGridReady}
      isEmbedToModal
      isEnableColumnPanel
    />
  );
};

export default McpRegistryGrid;
