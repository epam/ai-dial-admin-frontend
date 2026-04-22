'use client';

import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { IconFileDescription } from '@tabler/icons-react';
import { isEqual } from 'lodash';
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { infiniteGridOptions, SINGLE_ROW_SELECTION, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { MCP_REGISTRY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { FilterDto } from '@/src/models/request';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { McpRegistryFetchFn, McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import ListEntities from '@/src/components/ListView/List';

interface Props {
  selectedServer?: Pick<McpServer, 'name' | 'version'>;
  onSelect: (server: McpServer) => void;
  fetchServers: McpRegistryFetchFn;
  view: ApplicationRoute;
  infoPanel?: ReactNode;
  onShowDetails?: (server: McpServer) => void;
}

const REGISTRY_META_KEY = 'io.modelcontextprotocol.registry/official';

const McpRegistryGrid: FC<Props> = ({ selectedServer, onSelect, fetchServers, view, infoPanel, onShowDetails }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const fetchServersRef = useRef(fetchServers);
  fetchServersRef.current = fetchServers;

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: McpServer }) => {
        if (!data.data) return null;
        const isChecked =
          !!selectedServer?.version &&
          data.data.name === selectedServer.name &&
          data.data.version === selectedServer.version;
        return <RadioButtonRenderer inputId={`${data.data.name}@${data.data.version}`} isChecked={isChecked} />;
      },
    },
    onRowSelected: (event) => {
      if (event.node.isSelected() && event.data) {
        onSelect(event.data);
      }
    },
    onCellClicked: (event: CellClickedEvent) => {
      if (event.colDef.field === 'detailsColumn' && event.data) {
        onShowDetails?.(event.data);
      }
    },
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...MCP_REGISTRY_COLUMNS,
      {
        ...UTILITY_COLUMN,
        field: 'detailsColumn',
        cellRenderer: () => <IconFileDescription className="text-secondary" />,
        cellClass: 'relative',
        pinned: 'right',
        lockPinned: true,
      } as ColDef,
    ],
    [],
  );

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

        const searchFilter = currentFilters.find(({ column }) => column === 'name');
        const search = searchFilter ? String(searchFilter.value) : undefined;

        fetchServersRef
          .current({
            cursor: nextCursor || undefined,
            limit: 100,
            minResults: 100,
            search,
          })
          .then(({ response, success }) => {
            if (success) {
              const servers = (response.servers || []).map((s: McpServerResponse) => ({
                ...s.server,
                updatedAt: (s._meta?.[REGISTRY_META_KEY] as Record<string, unknown>)?.updatedAt,
              }));
              nextCursor = String(response.metadata?.nextCursor || '');
              params.successCallback(servers, nextCursor ? undefined : params.startRow + servers.length);
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
      columnDefs={columnDefs}
      listLabel={t(ContainersI18nKey.McpServers)}
      emptyDataProps={{ title: t(ContainersI18nKey.McpServers) }}
      storageKey={`mcp-registry-${view}`}
      additionalGridOptions={gridOptions}
      onGridReady={onGridReady}
      infoPanel={infoPanel}
      isEmbedToModal
      isEnableColumnPanel
    />
  );
};

export default McpRegistryGrid;
