import { describe, expect, test, vi } from 'vitest';

import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { AssetEximConfig, buildAssetsExport, importAssetsExport, stripMetadata } from '../exim';

interface Widget {
  id?: string;
  name: string;
}

describe('Server :: Assets :: exim :: stripMetadata', () => {
  test('removes `_metadata` and nothing else', () => {
    const entity = {
      name: 'name',
      content: 'body',
      nested: { keep: true },
      _metadata: { name: 'name', path: 'public/name', folderId: 'public/', author: 'a', updatedAt: '1' },
    };

    expect(stripMetadata(entity)).toEqual({ name: 'name', content: 'body', nested: { keep: true } });
  });

  test('passes an entity without `_metadata` through unchanged', () => {
    const entity: { name: string; content: string; _metadata?: unknown } = { name: 'name', content: 'body' };

    expect(stripMetadata(entity)).toEqual({ name: 'name', content: 'body' });
  });
});

// PROMPT is the versionless representative here (folder-nested, no `__` split on import); the
// versioned application/toolset fork of the engine gets its own test in the import describe.
const CONFIG: AssetEximConfig<Widget> = {
  resourceType: ResourceType.PROMPT,
  getEntities: (doc) => (doc as any).widgets,
  setEntities: (widgets) => ({ widgets }) as any,
};

const itemNode = (url: string) => ({ url, nodeType: 'ITEM' });
const folderNode = (url: string, items: unknown[] = []) => ({ url, nodeType: 'FOLDER', items });

describe('Server :: Assets :: exim :: buildAssetsExport', () => {
  test('fetches each selected entity and sets a prefixed id, keeping its `_metadata` as exported', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(itemNode('prompts/public/folder/name__1.0')),
      getMerged: vi.fn().mockResolvedValue({
        name: 'name',
        _metadata: { name: 'name', folderId: 'public/folder/', path: 'public/folder/name__1.0', author: 'me' },
      }),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.PROMPT, 'public/folder/name__1.0');
    // The export document carries the merged entity's `_metadata` verbatim — provenance for
    // consumers of the export; only the import side strips it.
    expect((result as any).widgets[0]).toEqual({
      name: 'name',
      _metadata: { name: 'name', folderId: 'public/folder/', path: 'public/folder/name__1.0', author: 'me' },
      id: 'prompts/public/folder/name__1.0',
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(null),
      getMerged: vi.fn().mockResolvedValue(null),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/missing']);

    expect((result as any).widgets).toEqual([]);
  });

  test('expands a folder path into every entity it directly contains', async () => {
    const assetApi = {
      getMetadata: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string, options: any) =>
          options?.recursive
            ? Promise.resolve(
                folderNode('prompts/public/folder/', [
                  itemNode('prompts/public/folder/a__1.0'),
                  itemNode('prompts/public/folder/b__1.0'),
                ]),
              )
            : Promise.resolve(folderNode('prompts/public/folder/')),
        ),
      getMerged: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string) => Promise.resolve({ name: path })),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/']);

    expect((result as any).widgets).toEqual([
      { name: 'public/folder/a__1.0', id: 'prompts/public/folder/a__1.0' },
      { name: 'public/folder/b__1.0', id: 'prompts/public/folder/b__1.0' },
    ]);
  });

  test('expands a folder path recursively, including entities in nested subfolders', async () => {
    const assetApi = {
      getMetadata: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string, options: any) =>
          options?.recursive
            ? Promise.resolve(
                folderNode('prompts/public/folder/', [
                  itemNode('prompts/public/folder/a__1.0'),
                  itemNode('prompts/public/folder/nested/b__1.0'),
                ]),
              )
            : Promise.resolve(folderNode('prompts/public/folder/')),
        ),
      getMerged: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string) => Promise.resolve({ name: path })),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/']);

    expect((result as any).widgets.map((w: any) => w.id)).toEqual([
      'prompts/public/folder/a__1.0',
      'prompts/public/folder/nested/b__1.0',
    ]);
  });

  test('an empty folder contributes no entities without failing the export', async () => {
    const assetApi = {
      getMetadata: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string, options: any) =>
          options?.recursive
            ? Promise.resolve(folderNode('prompts/public/folder/', []))
            : Promise.resolve(folderNode('prompts/public/folder/')),
        ),
      getMerged: vi.fn(),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/']);

    expect((result as any).widgets).toEqual([]);
    expect(assetApi.getMerged).not.toHaveBeenCalled();
  });

  test('excludes .dial_folder marker resources encountered during folder expansion', async () => {
    const assetApi = {
      getMetadata: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string, options: any) =>
          options?.recursive
            ? Promise.resolve(
                folderNode('prompts/public/folder/', [
                  itemNode('prompts/public/folder/a__1.0'),
                  itemNode('prompts/public/folder/.dial_folder'),
                  itemNode('prompts/public/folder/.dial_folder__1.0'),
                ]),
              )
            : Promise.resolve(folderNode('prompts/public/folder/')),
        ),
      getMerged: vi
        .fn()
        .mockImplementation((_t: unknown, _type: unknown, path: string) => Promise.resolve({ name: path })),
    } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/']);

    expect((result as any).widgets.map((w: any) => w.id)).toEqual(['prompts/public/folder/a__1.0']);
    expect(assetApi.getMerged).toHaveBeenCalledTimes(1);
  });

  test('a non-folder path is passed straight through to getMerged, unchanged', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(itemNode('prompts/public/name__1.0')),
      getMerged: vi.fn().mockResolvedValue({ name: 'name' }),
    } as any;

    await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledTimes(1);
    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.PROMPT, 'public/name__1.0');
  });
});

describe('Server :: Assets :: exim :: importAssetsExport', () => {
  const baseOptions = { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true };

  test('imports a valid entity successfully', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importAssetsExport(
      CONFIG,
      assetApi,
      {} as any,
      { widgets: [{ id: 'prompts/public/source/name__1.0', name: 'name__1.0' }] } as any,
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name__1.0' }),
      { allowOverride: true },
    );
    expect(result.importResults[0].status).toBe(ImportStatus.SUCCESS);
  });

  test('a versioned resource type splits the `__version` suffix off the id and grafts it onto the destination', async () => {
    const config: AssetEximConfig<Widget> = {
      ...CONFIG,
      resourceType: ResourceType.TOOLSET,
      getEntities: (doc) => (doc as any).toolsets,
      setEntities: (toolsets) => ({ toolsets }) as any,
    };
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    const result = await importAssetsExport(
      config,
      assetApi,
      {} as any,
      { toolsets: [{ id: 'toolsets/public/source/name__1.0', name: 'name' }] } as any,
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.TOOLSET,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name' }),
      { allowOverride: true },
    );
    expect(result.importResults[0].status).toBe(ImportStatus.SUCCESS);
  });

  test('applies a custom isValidId and rejects a non-matching id before calling Core', async () => {
    const config: AssetEximConfig<Widget> = { ...CONFIG, isValidId: () => false };
    const assetApi = { list: vi.fn(), put: vi.fn() } as any;

    const result = await importAssetsExport(
      config,
      assetApi,
      {} as any,
      { widgets: [{ id: 'prompts/public/name__1.0', name: 'name' }] } as any,
      baseOptions,
    );

    expect(assetApi.list).not.toHaveBeenCalled();
    expect(result.importResults[0].status).toBe(ImportStatus.FAILED);
  });

  test('applies transformForPut before writing, and strips `_metadata` around it', async () => {
    const config: AssetEximConfig<Widget> = {
      ...CONFIG,
      transformForPut: (widget) => ({ ...widget, name: `${widget.name}-transformed` }),
    };
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    await importAssetsExport(
      config,
      assetApi,
      {} as any,
      { widgets: [{ id: 'prompts/public/name__1.0', name: 'name', _metadata: { name: 'name', author: 'me' } }] } as any,
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name-transformed' }),
      { allowOverride: true },
    );
    const body = (assetApi.put as any).mock.calls[0][3];
    expect(body).not.toHaveProperty('_metadata');
  });

  test('strips `_metadata` from the written body even with no transformForPut', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    await importAssetsExport(
      CONFIG,
      assetApi,
      {} as any,
      { widgets: [{ id: 'prompts/public/name__1.0', name: 'name', _metadata: { name: 'name', author: 'me' } }] } as any,
      baseOptions,
    );

    // Exact body: `_metadata` gone, nothing else removed (the document-stamped `id` survives —
    // a type without a `transformForPut` identity strip; `AssetApi.put` recomputes prompt ids).
    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      { id: 'prompts/public/name__1.0', name: 'name' },
      { allowOverride: true },
    );
  });

  test('SKIP reports an existing conflict as skipped, not failed', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([{ path: 'public/target/name__1.0' }]),
      put: vi.fn(),
    } as any;

    const result = await importAssetsExport(
      CONFIG,
      assetApi,
      {} as any,
      { widgets: [{ id: 'prompts/public/name__1.0', name: 'name' }] } as any,
      { path: 'public/target/', conflictResolutionStrategy: 'skip', flatImport: true },
    );

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.importResults[0].status).toBe(ImportStatus.SKIP);
  });

  test('circuit breaker aborts the batch after consecutive real failures', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: false }),
    } as any;

    const widgets = Array.from({ length: 6 }, (_, i) => ({ id: `prompts/public/name${i}__1.0`, name: `n${i}` }));

    const result = await importAssetsExport(CONFIG, assetApi, {} as any, { widgets } as any, baseOptions);

    expect(assetApi.put).toHaveBeenCalledTimes(5);
    expect(result.importResults).toHaveLength(5);
  });
});
