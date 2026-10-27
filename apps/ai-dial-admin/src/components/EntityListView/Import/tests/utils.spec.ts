import { AssetImportGridData, ParsedAssets } from '@/src/models/import-asset';
import type { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ImportResult } from '@/src/models/import';
import { ImportStatus } from '@/src/types/import';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  changeFilesMap,
  generateAssetColumnsForImportGrid,
  generateAssetRowDataForImportGrid,
  getExistingFolderItems,
  getImportResults,
  getModalTitle,
  getMultipleImportStatus,
  isErrorFileNode,
  isErrorPromptNode,
  isInvalidJson,
} from '../utils';
import { ApplicationRoute } from '@/src/types/routes';
import { PromptsI18nKey, FoldersI18nKey, ApplicationsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';

const importResult = (overrides: Partial<ImportResult> = {}): ImportResult => ({
  sourcePath: 'source/prompt__1.0.0',
  targetPath: 'target/prompt__1.0.0',
  status: ImportStatus.SUCCESS,
  ...overrides,
});

const assetRow = (overrides: Partial<AssetImportGridData> = {}): AssetImportGridData => ({
  index: 0,
  name: 'item1',
  version: '1.0.0',
  assetName: 'id_for_prompt',
  ...overrides,
});

const fileRow = (overrides: Partial<FileImportGridData> = {}): FileImportGridData => ({
  index: 0,
  name: 'file.jpg',
  fileName: 'file',
  extension: '.jpg',
  ...overrides,
});

const promptAsset = (overrides: Partial<DialPrompt> = {}): DialPrompt => ({
  path: 'prompts/public/folder',
  folderId: 'public',
  ...overrides,
});

// `changeFilesMap` replaces a Files-view entry with a real `File` and stores it through
// `as unknown as DialFile` (see the util), so the fixture mirrors that rather than invent a shape.
const importedFile = (name: string): DialFile => new File([], name, { type: 'text/plain' }) as unknown as DialFile;

const entryOf = (map: Map<string, FileImportMap>, key: string): FileImportMap => {
  const entry = map.get(key);
  if (!entry) {
    throw new Error(`no import entry under ${key}`);
  }
  return entry;
};

const promptAt = (map: Map<string, FileImportMap>, key: string, index: number): DialPrompt =>
  entryOf(map, key).files[index] as DialPrompt;

describe('Import :: getImportResults', () => {
  const folderName = 'testFolder';
  const mockT = vi.fn().mockReturnValue('Translated Text');

  test('should call showNotification 1 time for success', () => {
    const results = [importResult()];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
  });

  test('should call showNotification 2 times for success and error', () => {
    const results = [importResult(), importResult({ status: ImportStatus.ERROR, targetPath: 'path' })];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(2);
  });

  test('should call showNotification 3 times for success and error and skip', () => {
    const results = [
      importResult(),
      importResult({ status: ImportStatus.ERROR, targetPath: 'path' }),
      importResult({ status: ImportStatus.SKIP, targetPath: 'path' }),
    ];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(3);
  });

  test('should call showNotification 3 times for success and error and skip even if more than 1 item of each', () => {
    const results = [
      importResult(),
      importResult(),
      importResult({ status: ImportStatus.ERROR, targetPath: 'path' }),
      importResult({ status: ImportStatus.ERROR, targetPath: 'path2' }),
      importResult({ status: ImportStatus.SKIP, targetPath: 'path' }),
      importResult({ status: ImportStatus.SKIP, targetPath: 'path2' }),
    ];
    const mockShowNotification = vi.fn();

    getImportResults(results, folderName, '', mockT, mockShowNotification);

    expect(mockShowNotification).toHaveBeenCalledTimes(3);
  });
});

describe('Import :: getMultipleImportStatus', () => {
  test('should return invalid status if no prompts in map', () => {
    const map = new Map();
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toBeUndefined();
  });

  test('should return error status if some prompts in map are invalid', () => {
    const map = new Map();
    map.set('item1', {
      prompt: {},
      isInvalid: true,
    });
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toEqual(StepStatus.ERROR);
  });

  test('should return valid status if all prompts in map are valid', () => {
    const map = new Map();
    map.set('item1', {
      prompt: {},
      isInvalid: false,
    });
    const result = getMultipleImportStatus(map as Map<string, FileImportMap>);

    expect(result).toEqual(StepStatus.VALID);
  });
});

describe('Import :: generatePromptRowDataForImportGrid', () => {
  test('decodes an exported text version exactly once for the read-only preview', () => {
    const map = new Map<string, FileImportMap>([
      [
        'item.json',
        {
          files: [promptAsset({ id: 'applications/public/assistant__internal__release%20%2520%20%E6%9C%AA%E6%9D%A5' })],
          isInvalid: false,
        },
      ],
    ]);
    expect(generateAssetRowDataForImportGrid(map)[0]).toMatchObject({
      assetName: 'assistant__internal',
      version: 'release %20 未来',
    });
  });
  test('convert to row data without existing prompts', () => {
    const map = new Map<string, FileImportMap>([
      ['item1', { files: [promptAsset({ id: 'id_for_prompt__1.0.0' })], isInvalid: false }],
    ]);

    const result = generateAssetRowDataForImportGrid(map);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        assetName: 'id_for_prompt',
        extension: '',
      },
    ]);
  });

  test('convert to row data with existing prompts', () => {
    const map = new Map<string, FileImportMap>([
      ['item1', { files: [promptAsset({ id: 'id_for_prompt__1.0.0' })], isInvalid: false }],
    ]);

    const result = generateAssetRowDataForImportGrid(map, [promptAsset({ path: 'somePath/folder' })]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1',
        version: '1.0.0',
        assetName: 'id_for_prompt',
        existingNames: ['folder'],
        extension: '',
      },
    ]);
  });
  test('convert to row data invalid prompt', () => {
    const map = new Map();
    map.set('item1.svg', {
      files: [
        {
          id: 'id_for_prompt__1.0.0',
        },
      ],
      isInvalid: true,
    });

    const result = generateAssetRowDataForImportGrid(map, [promptAsset({ path: 'somePath/folder' })]);

    expect(result).toEqual([
      {
        index: 0,
        name: 'item1.svg',
        version: '',
        assetName: '',
        extension: '.svg',
        invalid: true,
      },
    ]);
  });
});

describe('Import :: isErrorPromptNode', () => {
  test('should return true for a versioned asset whose name__version already exists', () => {
    const data = assetRow({ assetName: 'name', existingNames: ['name__1.0.0'] });
    const result = isErrorPromptNode(data);

    expect(result).toBeTruthy();
  });

  test('should return false for a versioned asset whose name__version is new', () => {
    const data = assetRow({ assetName: 'name', version: '2.0.0', existingNames: ['name__1.0.0'] });
    const result = isErrorPromptNode(data);

    expect(result).toBeFalsy();
  });

  test('should return true for a versionless prompt whose plain name already exists', () => {
    const data = {
      name: 'name__1.0.0',
      assetName: 'name__1.0.0',
      existingNames: ['name__1.0.0'],
      index: 0,
    };
    const result = isErrorPromptNode(data, true);

    expect(result).toBeTruthy();
  });

  test('should return false for a versionless prompt whose plain name is new', () => {
    const data = {
      name: 'name',
      assetName: 'name',
      existingNames: ['name__1.0.0'],
      index: 0,
    };
    const result = isErrorPromptNode(data, true);

    expect(result).toBeFalsy();
  });
});

describe('Import :: isErrorFileNode', () => {
  test('should return true', () => {
    const data = fileRow({ fileName: 'file', extension: '.jpg', existingNames: ['file.jpg'] });
    const result = isErrorFileNode(data);

    expect(result).toBeTruthy();
  });

  test('should return false', () => {
    const data = fileRow({ fileName: 'file', extension: '.jpg', existingNames: ['file.png'] });
    const result = isErrorFileNode(data);

    expect(result).toBeFalsy();
  });
});

describe('Import :: isInvalidJson', () => {
  test('returns true if prompts is missing or empty', () => {
    expect(isInvalidJson({})).toBe(true);
    expect(isInvalidJson({ prompts: [] })).toBe(true);
  });

  test('returns true if applications is missing or empty for non-prompts view', () => {
    expect(isInvalidJson({}, ApplicationRoute.Files)).toBe(true);
    expect(isInvalidJson({ applications: [] }, ApplicationRoute.Files)).toBe(true);
  });

  test('returns true if first prompt id does not match regex', () => {
    const parsedData: ParsedAssets = { prompts: [promptAsset({ id: 'invalid_id' })] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Prompts)).toBe(true);
  });

  test('returns false if first prompt id matches regex', () => {
    const parsedData: ParsedAssets = { prompts: [promptAsset({ id: 'prompts/public/folder/subfolder/myPrompt__v1' })] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Prompts)).toBe(false);
  });

  test('returns false for a prompt id with no `__` in the name — the suffix is not required', () => {
    const parsedData: ParsedAssets = { prompts: [promptAsset({ id: 'prompts/public/folder/myPrompt' })] };
    expect(isInvalidJson(parsedData, ApplicationRoute.Prompts)).toBe(false);
  });

  test('returns false for valid applications in non-prompts view', () => {
    const parsedData: ParsedAssets = {
      applications: [
        { path: 'applications/public/app', folderId: 'public', version: '1.0.0', id: 'anything' } as AssetApp,
      ],
    };
    expect(isInvalidJson(parsedData, ApplicationRoute.Files)).toBe(true);
  });
});

describe('generateAssetColumnsForImportGrid', () => {
  test('renders incoming Version as noneditable text while keeping the name editable', () => {
    const columns = generateAssetColumnsForImportGrid(vi.fn());
    const versionColumn = columns.find((column) => column.field === 'version');
    expect(versionColumn?.cellRenderer).toBeDefined();
    expect(versionColumn?.cellRendererSelector).toBeUndefined();
    expect(versionColumn?.cellRendererParams).toBeUndefined();
    expect(columns.find((column) => column.field === 'assetName')?.cellRendererSelector).toBeDefined();
  });
});

describe('Import :: changeFilesMap', () => {
  test('renames an imported asset without mutating its suffix or independent display version', () => {
    const source = {
      id: 'applications/public/assistant__internal__stable',
      name: 'assistant__internal',
      path: 'public/assistant__internal__stable',
      folderId: 'public/',
      version: 'stable',
      display_version: 'Spring release',
    };
    const sourceMap = new Map<string, FileImportMap>([['item.json', { files: [source], isInvalid: false }]]);
    const result = changeFilesMap(
      sourceMap,
      assetRow({ name: 'item.json', index: 0 }),
      'assetName',
      'renamed',
      ApplicationRoute.AssetsApplications,
    );
    expect(result.get('item.json')?.files[0]).toEqual({
      ...source,
      name: 'renamed',
      id: 'applications/public/renamed__stable',
    });
    expect(generateAssetRowDataForImportGrid(result)[0]).toMatchObject({ assetName: 'renamed', version: 'stable' });
    expect(sourceMap.get('item.json')?.files[0].name).toBe('assistant__internal');
  });
  let prevMap: Map<string, FileImportMap>;

  beforeEach(() => {
    // Initialize prevMap with files as an array of file objects
    prevMap = new Map<string, FileImportMap>([
      [
        'key1',
        {
          files: [
            promptAsset({ id: '123', name: 'oldFileName' }), // File 0
            promptAsset({ id: '456', name: 'anotherFile' }), // File 1
          ],
          isInvalid: false,
        },
      ],
    ]);
  });

  test('ignores attempted version edits for a public asset', () => {
    const result = changeFilesMap(
      prevMap,
      assetRow({ name: 'key1', index: 0 }),
      'version',
      'v2',
      ApplicationRoute.AssetsApplications,
    );
    expect(result.get('key1')?.files[0]).toEqual(prevMap.get('key1')?.files[0]);
  });

  test('should leave a prompt unchanged when field is "version" — the versionless grid never edits versions', () => {
    const result = changeFilesMap(
      prevMap,
      assetRow({ name: 'key1', index: 0 }),
      'version',
      'v2',
      ApplicationRoute.Prompts,
    );

    expect(promptAt(result, 'key1', 0).id).toBe('123');
  });

  test('should update assetName and file name when field is "assetName"', () => {
    const result = changeFilesMap(
      prevMap,
      assetRow({ name: 'key1', index: 1 }),
      'assetName',
      'newassetName',
      ApplicationRoute.Prompts,
    );

    expect(promptAt(result, 'key1', 1).id).toBe('newassetName');
    expect(promptAt(result, 'key1', 1).name).toBe('newassetName');
  });

  test('should use the new assetName verbatim for prompts — a `__` in the old name is not re-grafted', () => {
    const versionlessMap = new Map<string, FileImportMap>([
      [
        'key1',
        {
          files: [promptAsset({ id: 'oldFileName__1.0.3', name: 'oldFileName__1.0.3' })],
          isInvalid: false,
        },
      ],
    ]);

    const result = changeFilesMap(
      versionlessMap,
      assetRow({ name: 'key1', index: 0 }),
      'assetName',
      'newassetName',
      ApplicationRoute.Prompts,
    );

    expect(promptAt(result, 'key1', 0).id).toBe('newassetName');
    expect(promptAt(result, 'key1', 0).name).toBe('newassetName');
  });

  test('should update file content when field is "fileName"', () => {
    const result = changeFilesMap(
      prevMap,
      assetRow({ name: 'key1', index: 1 }),
      'fileName',
      'newFileName',
      ApplicationRoute.Prompts,
    );

    expect(promptAt(result, 'key1', 1).name).toBe('newFileName');
    expect(entryOf(result, 'key1').files[1] instanceof File).toBe(true);
  });

  test('should update imported file names for Files view', () => {
    const fileMap = new Map<string, FileImportMap>([
      ['key1.txt', { files: [importedFile('oldFileName.txt'), importedFile('anotherFile.txt')], isInvalid: false }],
    ]);
    const result = changeFilesMap(
      fileMap,
      assetRow({ name: 'key1.txt', index: 1 }),
      'fileName',
      'newFileName',
      ApplicationRoute.Files,
    );

    expect(result.get('key1.txt')?.files[1].name).toBe('newFileName.txt');
    expect(result.get('key1.txt')?.files[1] instanceof File).toBe(true);
  });

  test('should return a new map with updated file details', () => {
    const newMap = changeFilesMap(
      prevMap,
      assetRow({ name: 'key1', index: 0 }),
      'assetName',
      'newName',
      ApplicationRoute.Prompts,
    );

    expect(newMap).not.toBe(prevMap);
    expect(promptAt(newMap, 'key1', 0).id).toBe('newName');
  });
});

describe('getModalTitle', () => {
  const t = (key: string) => key;

  test('returns Prompts import title', () => {
    expect(getModalTitle(ApplicationRoute.Prompts, t)).toBe(PromptsI18nKey.Import);
  });

  test('returns Files import title', () => {
    expect(getModalTitle(ApplicationRoute.Files, t)).toBe(FoldersI18nKey.Import);
  });

  test('returns Applications import title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsApplications, t)).toBe(ApplicationsI18nKey.Import);
  });

  test('returns Toolsets import title', () => {
    expect(getModalTitle(ApplicationRoute.AssetsToolsets, t)).toBe(ToolsetI18nKey.Import);
  });

  test('returns empty string for unknown route', () => {
    expect(getModalTitle(undefined, t)).toBe('');
  });
});

describe('getExistingFolderItems', () => {
  const cached = [{ name: 'existing', path: 'public/folder/existing' }] as AssetListItem[];
  const createContext = (filePath: string | undefined, fetchedFoldersData: Record<string, AssetListItem[]>) =>
    ({ filePath, fetchedFoldersData }) as unknown as AssetsFolderContextReader<AssetListItem>;

  test('returns the items cached for the selected folder', () => {
    const context = createContext('public/folder/', { 'public/folder/': cached, 'public/other/': [] });

    expect(getExistingFolderItems(context)).toBe(cached);
  });

  test('returns an empty list when the selected folder has not been fetched', () => {
    expect(getExistingFolderItems(createContext('public/folder/', { 'public/other/': cached }))).toEqual([]);
  });

  test('returns an empty list when no folder is selected', () => {
    expect(getExistingFolderItems(createContext(undefined, { 'public/folder/': cached }))).toEqual([]);
  });

  test('returns an empty list without a context', () => {
    expect(getExistingFolderItems(undefined)).toEqual([]);
  });
});
