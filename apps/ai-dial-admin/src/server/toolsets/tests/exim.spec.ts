import { describe, expect, test, vi } from 'vitest';

import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { buildToolsetsExport, importToolsetsExport, resolveImportDestination } from '../exim';

describe('Server :: Toolsets :: exim :: resolveImportDestination', () => {
  test('flatImport drops the original folder structure', () => {
    expect(resolveImportDestination('public/target/', 'public/source/sub/', 'name', '1.0', true)).toBe(
      'public/target/name__1.0',
    );
  });

  test('non-flat import preserves the relative folder structure', () => {
    expect(resolveImportDestination('public/target/', 'public/source/sub/', 'name', '1.0', false)).toBe(
      'public/target/source/sub/name__1.0',
    );
  });
});

describe('Server :: Toolsets :: exim :: buildToolsetsExport', () => {
  test('fetches each selected toolset, sets a prefixed id, keeps authSettings unredacted', async () => {
    const assetApi = {
      getMerged: vi.fn().mockResolvedValue({
        name: 'name',
        version: '1.0',
        authSettings: { authenticationType: 'oauth', clientSecret: 'super-secret' },
      }),
    } as any;

    const result = await buildToolsetsExport(assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.TOOLSET, 'public/folder/name__1.0');
    expect(result.toolSets[0]).toEqual({
      name: 'name',
      version: '1.0',
      authSettings: { authenticationType: 'oauth', clientSecret: 'super-secret' },
      id: 'toolsets/public/folder/name__1.0',
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = { getMerged: vi.fn().mockResolvedValue(null) } as any;

    const result = await buildToolsetsExport(assetApi, {} as any, ['public/missing']);

    expect(result).toEqual({ toolSets: [] });
  });
});

describe('Server :: Toolsets :: exim :: importToolsetsExport', () => {
  const baseOptions = { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true };

  test('imports a valid toolset successfully', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importToolsetsExport(
      assetApi,
      {} as any,
      { toolSets: [{ id: 'toolsets/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.TOOLSET,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name' }),
      { allowOverride: true },
    );
    expect(result.importResults).toEqual([
      {
        sourcePath: 'toolsets/public/source/name__1.0',
        targetPath: 'public/target/name__1.0',
        status: ImportStatus.SUCCESS,
      },
    ]);
  });

  test('rejects an id missing the toolsets/ prefix before calling Core', async () => {
    const assetApi = { list: vi.fn(), put: vi.fn() } as any;

    const result = await importToolsetsExport(
      assetApi,
      {} as any,
      { toolSets: [{ id: 'not-a-valid-id', name: 'name' } as any] },
      baseOptions,
    );

    expect(assetApi.list).not.toHaveBeenCalled();
    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.importResults).toEqual([
      { sourcePath: 'not-a-valid-id', targetPath: '', status: ImportStatus.FAILED },
    ]);
  });

  test('SKIP reports an existing conflict as skipped, not failed', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([{ path: 'public/target/name__1.0' }]),
      put: vi.fn(),
    } as any;

    const result = await importToolsetsExport(
      assetApi,
      {} as any,
      { toolSets: [{ id: 'toolsets/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      { path: 'public/target/', conflictResolutionStrategy: 'skip', flatImport: true },
    );

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.importResults).toEqual([
      {
        sourcePath: 'toolsets/public/source/name__1.0',
        targetPath: 'public/target/name__1.0',
        status: ImportStatus.SKIP,
      },
    ]);
  });

  test('OVERRIDE writes through despite an existing conflict', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([{ path: 'public/target/name__1.0' }]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importToolsetsExport(
      assetApi,
      {} as any,
      { toolSets: [{ id: 'toolsets/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true },
    );

    expect(assetApi.put).toHaveBeenCalledTimes(1);
    expect(result.importResults[0].status).toBe(ImportStatus.SUCCESS);
  });

  test('circuit breaker aborts the batch after consecutive real failures', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: false }),
    } as any;

    const toolSets = Array.from({ length: 6 }, (_, i) => ({
      id: `toolsets/public/source/name${i}__1.0`,
      name: `name${i}`,
      version: '1.0',
    })) as any[];

    const result = await importToolsetsExport(assetApi, {} as any, { toolSets }, baseOptions);

    expect(assetApi.put).toHaveBeenCalledTimes(5);
    expect(result.importResults).toHaveLength(5);
    expect(result.importResults.every((r) => r.status === ImportStatus.FAILED)).toBe(true);
  });
});
