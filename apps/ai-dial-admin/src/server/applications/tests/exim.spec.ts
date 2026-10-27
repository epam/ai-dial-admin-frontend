import { describe, expect, test, vi } from 'vitest';

import { encodeCorePath } from '@/src/server/publications/path';
import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { buildApplicationsExport, importApplicationsExport, resolveImportDestination } from '../exim';

describe('Server :: Applications :: exim :: resolveImportDestination', () => {
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

describe('Server :: Applications :: exim :: buildApplicationsExport', () => {
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
      const exported = await buildApplicationsExport(assetApi, {} as any, [path]);
      expect(exported.applications?.[0].id).toBe(`applications/${encodeCorePath(path)}`);
      await importApplicationsExport(assetApi, {} as any, exported, {
        path: 'public/target/',
        conflictResolutionStrategy: 'override',
        flatImport: true,
      });
      expect(assetApi.put).toHaveBeenCalledWith(
        {},
        ResourceType.APPLICATION,
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
        getMetadata: vi.fn().mockResolvedValue({ url: `applications/${sourcePath}`, nodeType: 'ITEM' }),
        getMerged: vi.fn().mockResolvedValue({
          display_version: displayVersion,
          endpoint: 'http://app',
          _metadata: { version: 'release candidate' },
        }),
        list: vi.fn().mockResolvedValue([]),
        put: vi.fn().mockResolvedValue({ success: true }),
      } as any;
      const exported = await buildApplicationsExport(assetApi, {} as any, [sourcePath]);
      expect(exported.applications).toEqual([
        { id: `applications/${encodeCorePath(sourcePath)}`, display_version: displayVersion, endpoint: 'http://app' },
      ]);
      expect(assetApi.getMerged).toHaveBeenCalledOnce();
      await importApplicationsExport(assetApi, {} as any, exported, {
        path: 'public/target/',
        conflictResolutionStrategy: 'override',
        flatImport: true,
      });
      expect(assetApi.put).toHaveBeenCalledWith(
        {},
        ResourceType.APPLICATION,
        'public/target/assistant__internal__release candidate',
        { display_version: displayVersion, endpoint: 'http://app' },
        { allowOverride: true },
      );
    },
  );
  test('fetches each selected application, omits `_metadata`, and sets a prefixed id', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue({ url: 'applications/public/folder/name__1.0', nodeType: 'ITEM' }),
      getMerged: vi.fn().mockResolvedValue({
        name: 'name',
        version: '1.0',
        _metadata: { name: 'name', folderId: 'public/folder/', path: 'public/folder/name__1.0', version: '1.0' },
      }),
    } as any;

    const result = await buildApplicationsExport(assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.APPLICATION, 'public/folder/name__1.0');
    expect((result.applications ?? [])[0]).toEqual({
      name: 'name',
      version: '1.0',
      id: 'applications/public/folder/name__1.0',
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(null),
      getMerged: vi.fn().mockResolvedValue(null),
    } as any;

    const result = await buildApplicationsExport(assetApi, {} as any, ['public/missing']);

    expect(result).toEqual({ applications: [] });
  });
});

describe('Server :: Applications :: exim :: importApplicationsExport', () => {
  const baseOptions = { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true };

  test('imports a valid application successfully', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importApplicationsExport(
      assetApi,
      {} as any,
      { applications: [{ id: 'applications/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.APPLICATION,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name' }),
      { allowOverride: true },
    );
    expect(result.importResults).toEqual([
      {
        sourcePath: 'applications/public/source/name__1.0',
        targetPath: 'public/target/name__1.0',
        status: ImportStatus.SUCCESS,
      },
    ]);
  });

  test('strips folderId/path/version/id and the `_metadata` graft before writing to Core', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    await importApplicationsExport(
      assetApi,
      {} as any,
      {
        applications: [
          {
            id: 'applications/public/source/name__1.0',
            name: 'name',
            version: '1.0',
            folderId: 'public/source/',
            path: 'public/source/name__1.0',
            endpoint: 'http://123',
            _metadata: { name: 'name', folderId: 'public/source/', path: 'public/source/name__1.0' },
          } as any,
        ],
      },
      baseOptions,
    );

    const putBody = assetApi.put.mock.calls[0][3];
    expect(putBody).toEqual({ name: 'name', endpoint: 'http://123' });
  });

  test('rejects an id missing the applications/ prefix before calling Core', async () => {
    const assetApi = { list: vi.fn(), put: vi.fn() } as any;

    const result = await importApplicationsExport(
      assetApi,
      {} as any,
      { applications: [{ id: 'not-a-valid-id', name: 'name' } as any] },
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

    const result = await importApplicationsExport(
      assetApi,
      {} as any,
      { applications: [{ id: 'applications/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      { path: 'public/target/', conflictResolutionStrategy: 'skip', flatImport: true },
    );

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.importResults).toEqual([
      {
        sourcePath: 'applications/public/source/name__1.0',
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

    const result = await importApplicationsExport(
      assetApi,
      {} as any,
      { applications: [{ id: 'applications/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
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

    const applications = Array.from({ length: 6 }, (_, i) => ({
      id: `applications/public/source/name${i}__1.0`,
      name: `name${i}`,
      version: '1.0',
    })) as any[];

    const result = await importApplicationsExport(assetApi, {} as any, { applications }, baseOptions);

    expect(assetApi.put).toHaveBeenCalledTimes(5);
    expect(result.importResults).toHaveLength(5);
    expect(result.importResults.every((r) => r.status === ImportStatus.FAILED)).toBe(true);
  });
});
