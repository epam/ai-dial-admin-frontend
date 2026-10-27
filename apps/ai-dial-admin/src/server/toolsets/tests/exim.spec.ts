import { describe, expect, test, vi } from 'vitest';

import { encodeCorePath } from '@/src/server/publications/path';
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
  test.each(['%', '%20', 'release candidate', '未来 #?%'])(
    'serializes and round-trips path version %j without decoding it twice',
    async (version) => {
      const path = `public/team/assistant__internal__${version}`;
      const assetApi = {
        getMetadata: vi.fn().mockResolvedValue({ nodeType: 'ITEM' }),
        getMerged: vi.fn().mockResolvedValue({ display_version: 'Spring release' }),
        list: vi.fn().mockResolvedValue([]),
        put: vi.fn().mockResolvedValue({ success: true }),
      } as any;
      const exported = await buildToolsetsExport(assetApi, {} as any, [path]);
      expect(exported.toolSets?.[0].id).toBe(`toolsets/${encodeCorePath(path)}`);
      await importToolsetsExport(assetApi, {} as any, exported, {
        path: 'public/target/',
        conflictResolutionStrategy: 'override',
        flatImport: true,
      });
      expect(assetApi.put).toHaveBeenCalledWith(
        {},
        ResourceType.TOOLSET,
        `public/target/assistant__internal__${version}`,
        { display_version: 'Spring release' },
        { allowOverride: true },
      );
    },
  );
  test.each(['Spring release', '', 'stable'])(
    'round-trips independent display_version %j and only the selected complete path',
    async (displayVersion) => {
      const sourcePath = 'public/team/assistant__internal__release candidate';
      const assetApi = {
        getMetadata: vi.fn().mockResolvedValue({ url: `toolsets/${sourcePath}`, nodeType: 'ITEM' }),
        getMerged: vi.fn().mockResolvedValue({
          display_version: displayVersion,
          authSettings: { authenticationType: 'oauth', clientSecret: 'secret' },
          _metadata: { version: 'release candidate' },
        }),
        list: vi.fn().mockResolvedValue([]),
        put: vi.fn().mockResolvedValue({ success: true }),
      } as any;
      const exported = await buildToolsetsExport(assetApi, {} as any, [sourcePath]);
      expect(exported.toolSets).toEqual([
        {
          id: `toolsets/${encodeCorePath(sourcePath)}`,
          display_version: displayVersion,
          authSettings: { authenticationType: 'oauth', clientSecret: 'secret' },
        },
      ]);
      expect(assetApi.getMerged).toHaveBeenCalledOnce();
      await importToolsetsExport(assetApi, {} as any, exported, {
        path: 'public/target/',
        conflictResolutionStrategy: 'override',
        flatImport: true,
      });
      expect(assetApi.put).toHaveBeenCalledWith(
        {},
        ResourceType.TOOLSET,
        'public/target/assistant__internal__release candidate',
        { display_version: displayVersion, authSettings: { authenticationType: 'oauth', clientSecret: 'secret' } },
        { allowOverride: true },
      );
    },
  );
  test('fetches each selected toolset, omits `_metadata`, and keeps authSettings unredacted', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue({ url: 'toolsets/public/folder/name__1.0', nodeType: 'ITEM' }),
      getMerged: vi.fn().mockResolvedValue({
        name: 'name',
        version: '1.0',
        authSettings: { authenticationType: 'oauth', clientSecret: 'super-secret' },
        _metadata: { name: 'name', folderId: 'public/folder/', path: 'public/folder/name__1.0', version: '1.0' },
      }),
    } as any;

    const result = await buildToolsetsExport(assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.TOOLSET, 'public/folder/name__1.0');
    expect((result.toolSets ?? [])[0]).toEqual({
      name: 'name',
      version: '1.0',
      authSettings: { authenticationType: 'oauth', clientSecret: 'super-secret' },
      id: 'toolsets/public/folder/name__1.0',
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(null),
      getMerged: vi.fn().mockResolvedValue(null),
    } as any;

    const result = await buildToolsetsExport(assetApi, {} as any, ['public/missing']);

    expect(result).toEqual({ toolSets: [] });
  });
});

describe('Server :: Toolsets :: exim :: importToolsetsExport', () => {
  const baseOptions = { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true };

  test('imports a valid toolset successfully, stripping the flat identity fields and the `_metadata` graft', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importToolsetsExport(
      assetApi,
      {} as any,
      {
        toolSets: [
          {
            id: 'toolsets/public/source/name__1.0',
            name: 'name',
            version: '1.0',
            _metadata: { name: 'name', folderId: 'public/source/', path: 'public/source/name__1.0', version: '1.0' },
          } as any,
        ],
      },
      baseOptions,
    );

    // Exact body: `stripAssetIdentityFields` drops id/version, the import loop drops `_metadata`,
    // and nothing else is removed.
    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.TOOLSET,
      'public/target/name__1.0',
      { name: 'name' },
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
