/**
 * Generic import/export server-action orchestration, shared by prompts/toolsets/applications:
 * parses the `FormData`'s `config`/`file` parts, branches on JSON vs. zip, and shapes the
 * `ServerActionResponse`. The actual Core calls are injected per resource type (still going
 * through each type's mocked module boundary in tests, since these are passed by reference).
 */

import { ParsedAssets } from '@/src/models/import-asset';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetApi } from '@/src/server/core/asset-api';
import { Token } from '@/src/models/auth';
import { ImportFileType } from '@/src/types/import';
import { ImportAssetsOptions } from './exim';

export interface AssetImportDeps {
  assetApi: AssetApi;
  extractFromZip: (zipBuffer: ArrayBuffer) => Promise<ParsedAssets>;
  importExport: (
    assetApi: AssetApi,
    token: Token,
    document: ParsedAssets,
    options: ImportAssetsOptions,
  ) => Promise<{ importResults: ImportResult[] }>;
}

/** Parses an import `FormData` body (`config` + `file` parts) and runs the import. */
export const runAssetImportAction = async (
  token: Token,
  body: FormData,
  fileType: ImportFileType,
  deps: AssetImportDeps,
): Promise<ServerActionResponse<{ importResults: ImportResult[] }>> => {
  const configBlob = body.get('config') as Blob | null;
  if (!configBlob) {
    return { success: false, errorHeader: 'Bad Request', errorMessage: 'Missing import config' };
  }
  const config = JSON.parse(await configBlob.text()) as {
    path: string;
    conflictResolutionStrategy: string;
    flatImport?: boolean;
  };

  const fileBlob = body.get('file') as Blob | null;
  if (!fileBlob) {
    return { success: false, errorHeader: 'Bad Request', errorMessage: 'Missing import file' };
  }

  let document: ParsedAssets;
  if (fileType === ImportFileType.ARCHIVE) {
    try {
      document = await deps.extractFromZip(await fileBlob.arrayBuffer());
    } catch (error) {
      return { success: false, errorHeader: 'Bad Request', errorMessage: (error as Error).message };
    }
  } else {
    document = JSON.parse(await fileBlob.text()) as ParsedAssets;
  }

  const { importResults } = await deps.importExport(deps.assetApi, token, document, {
    path: config.path,
    conflictResolutionStrategy: config.conflictResolutionStrategy,
    flatImport: config.flatImport,
  });

  return { success: true, response: { importResults } };
};

export interface AssetExportDeps {
  assetApi: AssetApi;
  buildExport: (assetApi: AssetApi, token: Token, paths: string[]) => Promise<ParsedAssets>;
  buildZip: (document: ParsedAssets) => Promise<Blob>;
  zipFileName: string;
}

/** Builds the export document, wrapping it as a zip when `fileType` is `ARCHIVE`. */
export const runAssetExportAction = async (
  token: Token,
  paths: string[],
  fileType: ImportFileType | undefined,
  deps: AssetExportDeps,
): Promise<ParsedAssets | { blob: Blob; fileName: string }> => {
  const document = await deps.buildExport(deps.assetApi, token, paths);

  if (fileType === ImportFileType.ARCHIVE) {
    const blob = await deps.buildZip(document);
    return { blob, fileName: deps.zipFileName };
  }
  return document;
};
