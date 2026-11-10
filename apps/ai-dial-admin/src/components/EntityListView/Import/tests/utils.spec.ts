import { AssetImportGridData, ParsedAssets } from '@/src/models/import-asset';
import type { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { FileImportGridData, FileImportMap } from '@/src/models/file';
import { ImportResult } from '@/src/models/import';
import { ConflictResolutionPolicy, ImportStatus } from '@/src/types/import';
import { DialToolsetResourceAuthSettings, ToolsetAuthType } from '@/src/models/dial/resource';
import { CLIENT_SECRET_PLACEHOLDER } from '@/src/components/EntityListView/Import/constants';
import { ColDef } from 'ag-grid-community';
import { StepStatus } from '@epam/ai-dial-ui-kit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  applyToolsetClientSecrets,
  changeFilesMap,
  generateAssetColumnsForImportGrid,
  generateAssetRowDataForImportGrid,
  getExistingFolderItems,
  getImportResults,
  getModalTitle,
  getMultipleImportStatus,
  hasOAuthToolsets,
  isErrorFileNode,
  isErrorPromptNode,
  isInvalidJson,
  isOAuthToolsetFile,
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

const toolsetFile = (
  authSettings: DialToolsetResourceAuthSettings | undefined,
  overrides: Record<string, unknown> = {},
): AssetApp =>
  ({
    id: 'toolsets/public/github__1.0.0',
    name: 'github',
    version: '1.0.0',
    ...(authSettings ? { auth_settings: authSettings } : {}),
    ...overrides,
  }) as unknown as AssetApp;

const oauthToolset = (authSettings: DialToolsetResourceAuthSettings = {}, overrides: Record<string, unknown> = {}) =>
  toolsetFile(
    { authentication_type: ToolsetAuthType.OAUTH, client_id: 'cid', client_secret_hint: 'ab12', ...authSettings },
    overrides,
  );

const authSettingsOf = (file: unknown) => (file as { auth_settings?: DialToolsetResourceAuthSettings }).auth_settings;

describe('Import :: isOAuthToolsetFile', () => {
  test('matches OAUTH in either case', () => {
    expect(isOAuthToolsetFile(oauthToolset())).toBe(true);
    expect(isOAuthToolsetFile(toolsetFile({ authentication_type: 'oauth' as ToolsetAuthType }))).toBe(true);
  });

  test('rejects other auth types and files without auth settings', () => {
    expect(isOAuthToolsetFile(toolsetFile({ authentication_type: ToolsetAuthType.API_KEY }))).toBe(false);
    expect(isOAuthToolsetFile(toolsetFile({ authentication_type: ToolsetAuthType.NONE }))).toBe(false);
    expect(isOAuthToolsetFile(toolsetFile({}))).toBe(false);
    expect(isOAuthToolsetFile(toolsetFile(undefined))).toBe(false);
  });
});

describe('Import :: hasOAuthToolsets', () => {
  const entry = (files: AssetApp[], isInvalid = false): FileImportMap => ({ files, isInvalid });

  test('is true when any valid file holds an OAUTH toolset', () => {
    const map = new Map<string, FileImportMap>([
      ['a.json', entry([toolsetFile({ authentication_type: ToolsetAuthType.API_KEY })])],
      ['b.json', entry([oauthToolset()])],
    ]);

    expect(hasOAuthToolsets(map)).toBe(true);
  });

  test('ignores OAUTH toolsets in invalid files', () => {
    expect(hasOAuthToolsets(new Map([['broken.json', entry([oauthToolset()], true)]]))).toBe(false);
  });

  test('is false when nothing is OAUTH or nothing is parsed', () => {
    expect(hasOAuthToolsets(new Map([['a.json', entry([toolsetFile(undefined)])]]))).toBe(false);
    expect(hasOAuthToolsets(new Map())).toBe(false);
  });
});

describe('Import :: applyToolsetClientSecrets', () => {
  const { OVERRIDE, SKIP } = ConflictResolutionPolicy;

  test.each([OVERRIDE, SKIP])(
    'gives an untouched OAUTH toolset the placeholder and drops the hint (%s)',
    (resolution) => {
      const [result] = applyToolsetClientSecrets([oauthToolset()], resolution);

      expect(authSettingsOf(result)).toEqual({
        authentication_type: ToolsetAuthType.OAUTH,
        client_id: 'cid',
        client_secret: CLIENT_SECRET_PLACEHOLDER,
      });
    },
  );

  test.each([OVERRIDE, SKIP])('keeps a non-blank secret as entered (%s)', (resolution) => {
    const [result] = applyToolsetClientSecrets([oauthToolset({ client_secret: 'my-real-secret-123' })], resolution);

    expect(authSettingsOf(result)?.client_secret).toBe('my-real-secret-123');
    expect(authSettingsOf(result)).not.toHaveProperty('client_secret_hint');
  });

  test('omits a cleared secret under Override so Core keeps the stored one', () => {
    const [result] = applyToolsetClientSecrets([oauthToolset({ client_secret: '' })], OVERRIDE);

    expect(authSettingsOf(result)).not.toHaveProperty('client_secret');
    expect(authSettingsOf(result)?.client_id).toBe('cid');
  });

  test.each(['', '   '])('falls back to the placeholder for a blank secret %j under Skip', (blank) => {
    const [result] = applyToolsetClientSecrets([oauthToolset({ client_secret: blank })], SKIP);

    expect(authSettingsOf(result)?.client_secret).toBe(CLIENT_SECRET_PLACEHOLDER);
  });

  test('leaves other authentication types untouched, reference included', () => {
    const apiKey = toolsetFile({ authentication_type: ToolsetAuthType.API_KEY, api_key_header: 'Api-Key' });
    const noAuth = toolsetFile(undefined);

    const result = applyToolsetClientSecrets([apiKey, noAuth], SKIP);

    expect(result[0]).toBe(apiKey);
    expect(result[1]).toBe(noAuth);
  });

  test('keeps the rest of the toolset and does not mutate the input', () => {
    const source = oauthToolset();
    const snapshot = structuredClone(source);

    const [result] = applyToolsetClientSecrets([source], SKIP);

    expect(result).toMatchObject({ id: source.id, name: 'github', version: '1.0.0' });
    expect(source).toEqual(snapshot);
  });
});

describe('Import :: generateAssetRowDataForImportGrid with client secrets', () => {
  const mapOf = (...files: AssetApp[]) => new Map<string, FileImportMap>([['t.json', { files, isInvalid: false }]]);

  test('marks OAUTH rows and defaults their secret to the placeholder', () => {
    const [row] = generateAssetRowDataForImportGrid(mapOf(oauthToolset()), undefined, undefined, false, true);

    expect(row).toMatchObject({ isOAuth: true, clientSecret: CLIENT_SECRET_PLACEHOLDER });
  });

  test('shows the secret the file already carries, even a cleared one', () => {
    const [carried] = generateAssetRowDataForImportGrid(
      mapOf(oauthToolset({ client_secret: 'already-here-1' })),
      undefined,
      undefined,
      false,
      true,
    );
    const [cleared] = generateAssetRowDataForImportGrid(
      mapOf(oauthToolset({ client_secret: '' })),
      undefined,
      undefined,
      false,
      true,
    );

    expect(carried.clientSecret).toBe('already-here-1');
    expect(cleared.clientSecret).toBe('');
  });

  test('leaves other rows without a secret', () => {
    const [row] = generateAssetRowDataForImportGrid(
      mapOf(toolsetFile({ authentication_type: ToolsetAuthType.API_KEY })),
      undefined,
      undefined,
      false,
      true,
    );

    expect(row.isOAuth).toBe(false);
    expect(row.clientSecret).toBeUndefined();
  });

  test('adds nothing unless asked (prompts, applications, files path)', () => {
    const [row] = generateAssetRowDataForImportGrid(mapOf(oauthToolset()));

    expect(row).not.toHaveProperty('isOAuth');
    expect(row).not.toHaveProperty('clientSecret');
  });
});

describe('Import :: generateAssetColumnsForImportGrid client secret column', () => {
  const clientSecretColumn = { headerName: 'Client secret', getInputLabel: (name: string) => `label ${name}` };
  const selectRenderer = (column: ColDef, data: Partial<AssetImportGridData>) =>
    (column.cellRendererSelector as (params: { data: unknown }) => unknown)({ data });

  test('adds an editable column between Version and File only when asked', () => {
    const without = generateAssetColumnsForImportGrid(vi.fn());
    const withColumn = generateAssetColumnsForImportGrid(vi.fn(), undefined, undefined, false, clientSecretColumn);

    expect(without.map((column) => column.field)).toEqual(['assetName', 'version', 'name']);
    expect(withColumn.map((column) => column.field)).toEqual(['assetName', 'version', 'clientSecret', 'name']);
    expect(withColumn[2].headerName).toBe('Client secret');
  });

  test('renders the masked editor on OAUTH rows only', () => {
    const column = generateAssetColumnsForImportGrid(vi.fn(), undefined, undefined, false, clientSecretColumn)[2];

    expect(selectRenderer(column, { isOAuth: true })).toEqual({ component: expect.anything() });
    expect(selectRenderer(column, { isOAuth: false })).toBeUndefined();
    expect(selectRenderer(column, { isOAuth: true, invalid: true })).toBeUndefined();
  });

  test('does not render the editor in a readonly grid', () => {
    const column = generateAssetColumnsForImportGrid(vi.fn(), undefined, true, false, clientSecretColumn)[2];

    expect(selectRenderer(column, { isOAuth: true })).toBeUndefined();
  });

  test('labels each input with the row name and reports edits through onChange', () => {
    const onChange = vi.fn();
    const column = generateAssetColumnsForImportGrid(onChange, undefined, undefined, false, clientSecretColumn)[2];
    const params = column.cellRendererParams as {
      onChange: unknown;
      getInputLabel: (data: AssetImportGridData) => string;
    };

    expect(params.onChange).toBe(onChange);
    expect(params.getInputLabel(assetRow({ assetName: 'github' }))).toBe('label github');
  });
});

describe('Import :: changeFilesMap client secret', () => {
  const mapOf = (file: AssetApp) => new Map<string, FileImportMap>([['t.json', { files: [file], isInvalid: false }]]);

  test('writes the secret into auth_settings and keeps the other auth fields', () => {
    const prev = mapOf(oauthToolset());

    const result = changeFilesMap(
      prev,
      assetRow({ name: 't.json', index: 0 }),
      'clientSecret',
      'typed-secret-123',
      ApplicationRoute.AssetsToolsets,
    );

    expect(authSettingsOf(entryOf(result, 't.json').files[0])).toMatchObject({
      authentication_type: ToolsetAuthType.OAUTH,
      client_id: 'cid',
      client_secret: 'typed-secret-123',
    });
    expect(authSettingsOf(entryOf(prev, 't.json').files[0])).not.toHaveProperty('client_secret');
  });

  test('stores a cleared value as an empty string, which Finish reads as "keep the stored secret"', () => {
    const result = changeFilesMap(
      mapOf(oauthToolset({ client_secret: 'typed-secret-123' })),
      assetRow({ name: 't.json', index: 0 }),
      'clientSecret',
      '',
      ApplicationRoute.AssetsToolsets,
    );

    expect(authSettingsOf(entryOf(result, 't.json').files[0])?.client_secret).toBe('');
  });

  test('ignores a toolset that is not OAUTH', () => {
    const apiKey = toolsetFile({ authentication_type: ToolsetAuthType.API_KEY });

    const result = changeFilesMap(
      mapOf(apiKey),
      assetRow({ name: 't.json', index: 0 }),
      'clientSecret',
      'typed-secret-123',
      ApplicationRoute.AssetsToolsets,
    );

    expect(entryOf(result, 't.json').files[0]).toBe(apiKey);
  });
});
