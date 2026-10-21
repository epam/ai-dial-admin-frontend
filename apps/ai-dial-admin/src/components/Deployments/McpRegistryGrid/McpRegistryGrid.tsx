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

import { CACHE_LIMIT, infiniteGridOptions, SINGLE_ROW_SELECTION, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { MCP_REGISTRY_PAGE_SIZE } from '@/src/constants/deployments/mcp-registry';
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
    cacheBlockSize: MCP_REGISTRY_PAGE_SIZE,
    maxBlocksInCache: Math.floor(CACHE_LIMIT / MCP_REGISTRY_PAGE_SIZE),
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
    // Registry cursor to start each block from, keyed by block start row, so a block evicted from the
    // cache is refetched from its own cursor rather than the latest one
    const blockCursors = new Map<number, string>();
    let filters: FilterDto[] = [];
    return {
      getRows: async (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const currentFilters = getRequestFilters(params.filterModel);
        if (!isEqual(filters, currentFilters)) {
          blockCursors.clear();
        }
        filters = currentFilters;

        if (params.startRow > 0 && !blockCursors.has(params.startRow)) {
          params.failCallback();
          gridApi?.setGridOption('loading', false);
          return;
        }

        const searchFilter = currentFilters.find(({ column }) => column === 'name');
        const search = searchFilter ? String(searchFilter.value) : undefined;

        try {
          const servers: McpServer[] = [];
          let cursor = blockCursors.get(params.startRow) || undefined;

          // A short page with a cursor would leave gaps in the block, so top it up to the block size
          do {
            const { response, success } = await fetchServersRef.current({
              cursor,
              limit: MCP_REGISTRY_PAGE_SIZE - servers.length,
              search,
            });
            if (!success) {
              params.failCallback();
              return;
            }
            servers.push(
              ...(response.servers || []).map((s: McpServerResponse) => ({
                ...s.server,
                updatedAt: (s._meta?.[REGISTRY_META_KEY] as Record<string, unknown>)?.updatedAt,
              })),
            );
            cursor = response.metadata?.nextCursor || undefined;
          } while (cursor && servers.length < MCP_REGISTRY_PAGE_SIZE);

          blockCursors.set(params.startRow + MCP_REGISTRY_PAGE_SIZE, cursor ?? '');
          params.successCallback(servers, cursor ? undefined : params.startRow + servers.length);
        } catch {
          params.failCallback();
        } finally {
          gridApi?.setGridOption('loading', false);
        }
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
