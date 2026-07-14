import { describe, expect, test, vi } from 'vitest';

import { ImportStatus } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { buildPromptsExport, importPromptsExport, isValidPromptExportId, resolveImportDestination } from '../exim';

describe('Server :: Prompts :: exim :: isValidPromptExportId', () => {
  test('accepts a well-shaped id', () => {
    expect(isValidPromptExportId('prompts/public/folder/name__1.0')).toBe(true);
  });

  test('accepts a nested-folder id', () => {
    expect(isValidPromptExportId('prompts/public/a/b/name__1.0')).toBe(true);
  });

  test('rejects an id missing the version suffix', () => {
    expect(isValidPromptExportId('prompts/public/folder/name')).toBe(false);
  });

  test('rejects a missing id', () => {
    expect(isValidPromptExportId(undefined)).toBe(false);
  });
});

describe('Server :: Prompts :: exim :: resolveImportDestination', () => {
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
});

describe('Server :: Prompts :: exim :: buildPromptsExport', () => {
  test('fetches each selected prompt and sets a prefixed id', async () => {
    const assetApi = {
      getMerged: vi.fn().mockResolvedValue({ name: 'name', version: '1.0', content: 'hi' }),
    } as any;

    const result = await buildPromptsExport(assetApi, {} as any, ['public/folder/name__1.0']);

    expect(assetApi.getMerged).toHaveBeenCalledWith({}, ResourceType.PROMPT, 'public/folder/name__1.0');
    expect(result).toEqual({
      prompts: [{ name: 'name', version: '1.0', content: 'hi', id: 'prompts/public/folder/name__1.0' }],
    });
  });

  test('skips a path that resolves to nothing', async () => {
    const assetApi = { getMerged: vi.fn().mockResolvedValue(null) } as any;

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

    const result = await importPromptsExport(
      assetApi,
      {} as any,
      { prompts: [{ id: 'prompts/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
      baseOptions,
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      {},
      ResourceType.PROMPT,
      'public/target/name__1.0',
      expect.objectContaining({ name: 'name' }),
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
      { prompts: [{ id: 'prompts/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
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
      { prompts: [{ id: 'prompts/public/source/name__1.0', name: 'name', version: '1.0' } as any] },
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
      name: `name${i}`,
      version: '1.0',
    })) as any[];

    const result = await importPromptsExport(assetApi, {} as any, { prompts }, baseOptions);

    expect(assetApi.put).toHaveBeenCalledTimes(5);
    expect(result.importResults).toHaveLength(5);
    expect(result.importResults.every((r) => r.status === ImportStatus.FAILED)).toBe(true);
  });
});
