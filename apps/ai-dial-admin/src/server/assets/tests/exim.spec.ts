import { describe, expect, test, vi } from 'vitest';

import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { AssetEximConfig, buildAssetsExport, importAssetsExport } from '../exim';

interface Widget {
  id?: string;
  name: string;
  version?: string;
}

const CONFIG: AssetEximConfig<Widget> = {
  resourceType: ResourceType.PROMPT,
  getEntities: (doc) => (doc as any).widgets,
  setEntities: (widgets) => ({ widgets }) as any,
};

describe('Server :: Assets :: exim :: buildAssetsExport', () => {
  test('fetches each selected entity and sets a prefixed id', async () => {
    const assetApi = { getMerged: vi.fn().mockResolvedValue({ name: 'name', version: '1.0' }) } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.PROMPT, 'public/folder/name__1.0');
    expect((result as any).widgets[0]).toEqual({
      name: 'name',
      version: '1.0',
      id: 'prompts/public/folder/name__1.0',
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = { getMerged: vi.fn().mockResolvedValue(null) } as any;

    const result = await buildAssetsExport(CONFIG, assetApi, {} as any, ['public/missing']);

    expect((result as any).widgets).toEqual([]);
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
      { widgets: [{ id: 'prompts/public/source/name__1.0', name: 'name', version: '1.0' }] } as any,
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
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

  test('applies transformForPut before writing', async () => {
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
      { widgets: [{ id: 'prompts/public/name__1.0', name: 'name' }] } as any,
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name-transformed' }),
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
