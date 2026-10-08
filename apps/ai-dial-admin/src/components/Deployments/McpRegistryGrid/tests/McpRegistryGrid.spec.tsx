import { act, render } from '@testing-library/react';
import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import McpRegistryGrid from '@/src/components/Deployments/McpRegistryGrid/McpRegistryGrid';
import { CACHE_LIMIT } from '@/src/constants/ag-grid';
import { MCP_REGISTRY_PAGE_SIZE } from '@/src/constants/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';

interface CapturedProps {
  additionalGridOptions?: GridOptions;
  onGridReady?: (event: GridReadyEvent) => void;
}

let captured: CapturedProps = {};

vi.mock('@/src/components/ListView/List', () => ({
  default: (props: CapturedProps) => {
    captured = props;
    return <section aria-label="grid" />;
  },
}));

const makeServers = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({ server: { name: `${prefix}-${index}`, version: '1.0.0' } }));

const rowsOf = (count: number, prefix: string) =>
  makeServers(count, prefix).map(({ server }) => ({ ...server, updatedAt: undefined }));

const page = (count: number, prefix: string, nextCursor?: string) => ({
  success: true,
  response: { servers: makeServers(count, prefix), metadata: { nextCursor } },
});

const fetchServers = vi.fn();
let datasource: IDatasource;

const getRows = async (startRow: number) => {
  const successCallback = vi.fn();
  const failCallback = vi.fn();
  await datasource.getRows({
    startRow,
    endRow: startRow + MCP_REGISTRY_PAGE_SIZE,
    filterModel: {},
    sortModel: [],
    successCallback,
    failCallback,
    context: undefined,
  } as unknown as IGetRowsParams);
  return { successCallback, failCallback };
};

describe('McpRegistryGrid', () => {
  beforeEach(() => {
    fetchServers.mockReset();
    captured = {};
    const setGridOption = vi.fn((option: string, value: unknown) => {
      if (option === 'datasource') {
        datasource = value as IDatasource;
      }
    });
    render(<McpRegistryGrid onSelect={vi.fn()} fetchServers={fetchServers} view={ApplicationRoute.McpContainers} />);
    act(() => {
      captured.onGridReady?.({ api: { setGridOption } as unknown as GridApi } as GridReadyEvent);
    });
  });

  test('sizes a grid block to one registry page and keeps the cache within the shared limit', () => {
    expect(captured.additionalGridOptions?.cacheBlockSize).toBe(MCP_REGISTRY_PAGE_SIZE);
    expect(captured.additionalGridOptions?.maxBlocksInCache).toBe(Math.floor(CACHE_LIMIT / MCP_REGISTRY_PAGE_SIZE));
  });

  test('requests one page for the first block and leaves the row count open while a cursor remains', async () => {
    fetchServers.mockResolvedValueOnce(page(MCP_REGISTRY_PAGE_SIZE, 'a', 'c1'));

    const { successCallback } = await getRows(0);

    expect(fetchServers).toHaveBeenCalledOnce();
    expect(fetchServers).toHaveBeenCalledWith({
      cursor: undefined,
      limit: MCP_REGISTRY_PAGE_SIZE,
      search: undefined,
    });
    expect(successCallback).toHaveBeenCalledWith(rowsOf(MCP_REGISTRY_PAGE_SIZE, 'a'), undefined);
  });

  test('tops up a short page from the returned cursor so the block has no gaps', async () => {
    fetchServers
      .mockResolvedValueOnce(page(4, 'a', 'c1'))
      .mockResolvedValueOnce(page(MCP_REGISTRY_PAGE_SIZE - 4, 'b', 'c2'));

    const { successCallback } = await getRows(0);

    expect(fetchServers).toHaveBeenNthCalledWith(2, {
      cursor: 'c1',
      limit: MCP_REGISTRY_PAGE_SIZE - 4,
      search: undefined,
    });
    expect(successCallback).toHaveBeenCalledWith(
      [...rowsOf(4, 'a'), ...rowsOf(MCP_REGISTRY_PAGE_SIZE - 4, 'b')],
      undefined,
    );
  });

  test('reports the final row count once the registry cursor is exhausted', async () => {
    fetchServers.mockResolvedValueOnce(page(7, 'a'));

    const { successCallback } = await getRows(0);

    expect(fetchServers).toHaveBeenCalledOnce();
    expect(successCallback).toHaveBeenCalledWith(rowsOf(7, 'a'), 7);
  });

  test('refetches an evicted block from its own cursor, not the latest one', async () => {
    fetchServers
      .mockResolvedValueOnce(page(MCP_REGISTRY_PAGE_SIZE, 'a', 'c1'))
      .mockResolvedValueOnce(page(MCP_REGISTRY_PAGE_SIZE, 'b', 'c2'))
      .mockResolvedValueOnce(page(MCP_REGISTRY_PAGE_SIZE, 'b', 'c2'));

    await getRows(0);
    await getRows(MCP_REGISTRY_PAGE_SIZE);
    await getRows(MCP_REGISTRY_PAGE_SIZE);

    expect(fetchServers).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursor: 'c1' }));
    expect(fetchServers).toHaveBeenNthCalledWith(3, expect.objectContaining({ cursor: 'c1' }));
  });

  test('fails a later block whose cursor is unknown instead of refetching the first page', async () => {
    const { failCallback, successCallback } = await getRows(MCP_REGISTRY_PAGE_SIZE * 3);

    expect(fetchServers).not.toHaveBeenCalled();
    expect(failCallback).toHaveBeenCalledOnce();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('fails the block when the registry request fails', async () => {
    fetchServers.mockResolvedValueOnce({ success: false });

    const { failCallback, successCallback } = await getRows(0);

    expect(failCallback).toHaveBeenCalledOnce();
    expect(successCallback).not.toHaveBeenCalled();
  });

  test('fails the block when the registry request throws', async () => {
    fetchServers.mockRejectedValueOnce(new Error('boom'));

    const { failCallback } = await getRows(0);

    expect(failCallback).toHaveBeenCalledOnce();
  });
});
