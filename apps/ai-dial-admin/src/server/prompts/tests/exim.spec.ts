import { describe, expect, test, vi } from 'vitest';

import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { buildPromptsExport, importPromptsExport, isValidPromptExportId, resolveImportDestination } from '../exim';

describe('Server :: Prompts :: exim :: isValidPromptExportId', () => {
  test('accepts an id whose name has no `__`', () => {
    expect(isValidPromptExportId('prompts/public/folder/name')).toBe(true);
  });

  test('accepts a nested-folder id', () => {
    expect(isValidPromptExportId('prompts/public/a/b/name')).toBe(true);
  });

  test('accepts a name containing `__` verbatim — it is part of the name, not a version suffix', () => {
    expect(isValidPromptExportId('prompts/public/folder/name__1.0')).toBe(true);
  });

  test('rejects a missing id', () => {
    expect(isValidPromptExportId(undefined)).toBe(false);
  });
});

describe('Server :: Prompts :: exim :: resolveImportDestination', () => {
  // The helper is shared with toolsets/applications; the explicit-version cases below exercise
  // its versioned path, while prompts always pass `undefined` and keep the name verbatim.
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

  test('non-flat import with no nested subfolder', () => {
    expect(resolveImportDestination('public/target/', 'public/', 'name', undefined, false)).toBe('public/target/name');
  });

  test('a versionless prompt keeps a `__` in the name verbatim', () => {
    expect(resolveImportDestination('public/target/', 'public/source/', 'name__1.0', undefined, true)).toBe(
      'public/target/name__1.0',
    );
  });
});

describe('Server :: Prompts :: exim :: buildPromptsExport', () => {
  test('fetches each selected prompt and sets a prefixed id, keeping its `_metadata` as exported', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue({ url: 'prompts/public/folder/name__1.0', nodeType: 'ITEM' }),
      getMerged: vi.fn().mockResolvedValue({
        name: 'name__1.0',
        content: 'hi',
        _metadata: { name: 'name__1.0', folderId: 'public/folder/', path: 'public/folder/name__1.0', author: 'me' },
      }),
    } as any;

    const result = await buildPromptsExport(assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.PROMPT, 'public/folder/name__1.0');
    // A `__` in the fetched name survives into the export document verbatim — no version split —
    // and the merged entity's `_metadata` rides along as provenance; only import strips it.
    expect(result).toEqual({
      prompts: [
        {
          name: 'name__1.0',
          content: 'hi',
          _metadata: { name: 'name__1.0', folderId: 'public/folder/', path: 'public/folder/name__1.0', author: 'me' },
          id: 'prompts/public/folder/name__1.0',
        },
      ],
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = {
      getMetadata: vi.fn().mockResolvedValue(null),
      getMerged: vi.fn().mockResolvedValue(null),
    } as any;

    const result = await buildPromptsExport(assetApi, {} as any, ['public/missing']);

    expect(result).toEqual({ prompts: [] });
  });
});

describe('Server :: Prompts :: exim :: importPromptsExport', () => {
  const baseOptions = { path: 'public/target/', conflictResolutionStrategy: 'override', flatImport: true };

  test('imports a valid prompt successfully', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue({ success: true }),
    } as any;

    // An old exported id with `__1.0` in it: the whole last segment is the name — nothing is
    // split off as a version, no `version` field rides along on the body, and the `_metadata`
    // provenance the export carries is stripped before the write.
    const result = await importPromptsExport(
      assetApi,
      {} as any,
      {
        prompts: [
          {
            id: 'prompts/public/source/name__1.0',
            name: 'name__1.0',
            _metadata: { name: 'name__1.0', folderId: 'public/source/', path: 'public/source/name__1.0' },
          } as any,
        ],
      },
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name__1.0' }),
      { allowOverride: true },
    );
    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.not.objectContaining({ version: expect.anything(), _metadata: expect.anything() }),
      { allowOverride: true },
    );
    expect(result.importResults).toEqual([
      {
        sourcePath: 'prompts/public/source/name__1.0',
        targetPath: 'public/target/name__1.0',
        status: ImportStatus.SUCCESS,
      },
    ]);
  });

  test('rejects a malformed id before calling Core', async () => {
    const assetApi = { list: vi.fn(), put: vi.fn() } as any;

    const result = await importPromptsExport(
      assetApi,
      {} as any,
      { prompts: [{ id: 'not-a-valid-id', name: 'name' } as any] },
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

    const result = await importPromptsExport(
      assetApi,
      {} as any,
      { prompts: [{ id: 'prompts/public/source/name__1.0', name: 'name__1.0' } as any] },
      { path: 'public/target/', conflictResolutionStrategy: 'skip', flatImport: true },
    );

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.importResults).toEqual([
      {
        sourcePath: 'prompts/public/source/name__1.0',
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

    const result = await importPromptsExport(
      assetApi,
      {} as any,
      { prompts: [{ id: 'prompts/public/source/name__1.0', name: 'name__1.0' } as any] },
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

    const prompts = Array.from({ length: 6 }, (_, i) => ({
      id: `prompts/public/source/name${i}__1.0`,
      name: `name${i}__1.0`,
    })) as any[];

    const result = await importPromptsExport(assetApi, {} as any, { prompts }, baseOptions);

    expect(assetApi.put).toHaveBeenCalledTimes(5);
    expect(result.importResults).toHaveLength(5);
    expect(result.importResults.every((r) => r.status === ImportStatus.FAILED)).toBe(true);
  });
});
