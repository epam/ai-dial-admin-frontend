import { describe, expect, test, vi } from 'vitest';

import { ImportFileType } from '@/src/types/import';
import { runAssetExportAction, runAssetImportAction } from '../import-export-action';

describe('Server :: Assets :: import-export-action :: runAssetImportAction', () => {
  test('rejects when config is missing', async () => {
    const result = await runAssetImportAction({} as any, new FormData(), ImportFileType.JSON, {
      assetApi: {} as any,
      extractFromZip: vi.fn(),
      importExport: vi.fn(),
    });

    expect(result).toEqual({ success: false, errorHeader: 'Bad Request', errorMessage: 'Missing import config' });
  });

  test('rejects when file is missing', async () => {
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));

    const result = await runAssetImportAction({} as any, body, ImportFileType.JSON, {
      assetApi: {} as any,
      extractFromZip: vi.fn(),
      importExport: vi.fn(),
    });

    expect(result).toEqual({ success: false, errorHeader: 'Bad Request', errorMessage: 'Missing import file' });
  });

  test('parses JSON body and delegates to importExport', async () => {
    const importExport = vi.fn().mockResolvedValue({ importResults: [{ status: 'success' }] });
    const document = { widgets: [{ id: 'widgets/a' }] };
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));
    body.append('file', new Blob([JSON.stringify(document)]));
    const assetApi = {} as any;

    const result = await runAssetImportAction('token' as any, body, ImportFileType.JSON, {
      assetApi,
      extractFromZip: vi.fn(),
      importExport,
    });

    expect(importExport).toHaveBeenCalledWith(assetApi, 'token', document, {
      path: 'public/',
      conflictResolutionStrategy: 'override',
      flatImport: undefined,
    });
    expect(result).toEqual({ success: true, response: { importResults: [{ status: 'success' }] } });
  });

  test('extracts a zip archive before delegating, and surfaces extraction errors', async () => {
    const extractFromZip = vi.fn().mockRejectedValue(new Error('bad zip'));
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'skip' })]));
    body.append('file', new Blob(['zip-bytes']));

    const result = await runAssetImportAction({} as any, body, ImportFileType.ARCHIVE, {
      assetApi: {} as any,
      extractFromZip,
      importExport: vi.fn(),
    });

    expect(extractFromZip).toHaveBeenCalled();
    expect(result).toEqual({ success: false, errorHeader: 'Bad Request', errorMessage: 'bad zip' });
  });
});

describe('Server :: Assets :: import-export-action :: runAssetExportAction', () => {
  test('returns the raw document for non-archive export', async () => {
    const buildExport = vi.fn().mockResolvedValue({ widgets: [] });
    const buildZip = vi.fn();
    const assetApi = {} as any;

    const result = await runAssetExportAction('token' as any, ['a'], undefined, {
      assetApi,
      buildExport,
      buildZip,
      zipFileName: 'x.zip',
    });

    expect(buildExport).toHaveBeenCalledWith(assetApi, 'token', ['a']);
    expect(buildZip).not.toHaveBeenCalled();
    expect(result).toEqual({ widgets: [] });
  });

  test('wraps the document as a zip for archive export', async () => {
    const document = { widgets: [] };
    const blob = new Blob(['zip']);
    const buildExport = vi.fn().mockResolvedValue(document);
    const buildZip = vi.fn().mockResolvedValue(blob);

    const result = await runAssetExportAction('token' as any, ['a'], ImportFileType.ARCHIVE, {
      assetApi: {} as any,
      buildExport,
      buildZip,
      zipFileName: 'x.zip',
    });

    expect(buildZip).toHaveBeenCalledWith(document);
    expect(result).toEqual({ blob, fileName: 'x.zip' });
  });
});
