import { describe, expect, test } from 'vitest';
import { FileManagerColumnKey, DialFile, DialFileNodeType } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';
import { ApplicationRoute } from '@/src/types/routes';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import FormattedValueCellRenderer from '@/src/components/Grid/CellRenderers/FormattedValueCellRenderer';
import {
  getDeleteModalDescription,
  getDeleteModalTitle,
  getGridColumns,
  generateTreeForDeletingItems,
  normalizePath,
} from '@/src/components/Assets/Modals/utils';

const t = (key: string, options?: Record<string, string | number>) =>
  options?.items ? `${key}:${options.items}` : key;
const assets: AssetWithVersion[] = ['stable', 'release candidate'].map((version) => ({
  name: 'assistant',
  version,
  path: `public/team/assistant__${version}`,
  folderId: 'public/team/',
  nodeType: DialFileNodeType.ITEM,
}));

describe('getGridColumns', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'renders scalar Version for public %s',
    (view) => {
      const columns = getGridColumns(view, false, assets as unknown as DialFile[]);
      expect(columns).toHaveLength(2);
      expect(columns.find((column) => (column as ColDef).colId === FileManagerColumnKey.Version)).toMatchObject({
        field: 'version',
        cellRenderer: FormattedValueCellRenderer,
      });
    },
  );
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'keeps platform %s unversioned',
    (view) => {
      expect(getGridColumns(view, false, [{ bucket: 'platform', folderId: 'platform/' } as DialFile])).toEqual([
        expect.objectContaining({ colId: FileManagerColumnKey.Name }),
        expect.objectContaining({ colId: FileManagerColumnKey.Author }),
      ]);
    },
  );
  test.each([ApplicationRoute.Prompts, ApplicationRoute.Conversations])('keeps %s versionless', (view) => {
    expect(getGridColumns(view, true)).toHaveLength(1);
  });
  test('keeps file sizes in folder previews', () => {
    expect(getGridColumns(ApplicationRoute.Files, true)[1]).toMatchObject({ colId: FileManagerColumnKey.Size });
  });
});

describe('getDeleteModalTitle', () => {
  test('uses the folder-aware title when folders are selected', () => {
    expect(getDeleteModalTitle(ApplicationRoute.AssetsApplications, t, 2, true)).toBe(
      FileManagerI18nKey.DeleteItemsAndFoldersModalTitle,
    );
  });
  test.each([
    [ApplicationRoute.Prompts, FileManagerI18nKey.Prompt, FileManagerI18nKey.Prompts],
    [ApplicationRoute.AssetsApplications, FileManagerI18nKey.Application, FileManagerI18nKey.Applications],
    [ApplicationRoute.AssetsToolsets, FileManagerI18nKey.Toolset, FileManagerI18nKey.Toolsets],
    [ApplicationRoute.Skills, FileManagerI18nKey.Skill, FileManagerI18nKey.Skills],
    [ApplicationRoute.Files, FileManagerI18nKey.File, FileManagerI18nKey.Files],
  ])('uses actual selected row counts for %s', (view, singular, plural) => {
    expect(getDeleteModalTitle(view as ApplicationRoute, t, 1, false)).toBe(
      `${FileManagerI18nKey.DeleteItemsModalTitle}:${singular}`,
    );
    expect(getDeleteModalTitle(view as ApplicationRoute, t, 2, false)).toBe(
      `${FileManagerI18nKey.DeleteItemsModalTitle}:${plural}`,
    );
  });
});

describe('getDeleteModalDescription', () => {
  test.each([
    ApplicationRoute.Prompts,
    ApplicationRoute.AssetsApplications,
    ApplicationRoute.AssetsToolsets,
    ApplicationRoute.Skills,
    ApplicationRoute.Files,
  ])('describes recursive folder deletion for %s', (view) => {
    expect(getDeleteModalDescription(view, t, 2, true)).toContain(
      FileManagerI18nKey.DeleteItemsAndFoldersModalDescription,
    );
    expect(getDeleteModalDescription(view, t, 1, false)).toContain(FileManagerI18nKey.DeleteItemsModalDescription);
  });
});

describe('normalizePath', () => {
  test('adds a missing trailing slash without duplicating it', () => {
    expect(normalizePath('public/team')).toBe('public/team/');
    expect(normalizePath('public/team/')).toBe('public/team/');
  });
});

describe('generateTreeForDeletingItems', () => {
  test('keeps same-name resource mappings distinct by their stored leaves', () => {
    const { treeItems, pathMapping } = generateTreeForDeletingItems(
      assets,
      assets as unknown as DialFile[],
      'Selected',
    );
    expect(treeItems[0].items?.map((item) => item.path)).toEqual([
      'Selected/assistant__stable',
      'Selected/assistant__release candidate',
    ]);
    expect([...pathMapping.values()]).toEqual(assets.map((asset) => asset.path));
    expect(pathMapping.size).toBe(2);
  });
  test('matches the selected full path even when sibling ids are equal', () => {
    const rows = assets.map((asset) => ({ ...asset, id: 'assistant' }));
    const { treeItems, pathMapping } = generateTreeForDeletingItems(
      rows,
      [rows[1]] as unknown as DialFile[],
      'Selected',
    );
    expect(treeItems[0].items?.map((item) => item.path)).toEqual(['Selected/assistant__release candidate']);
    expect([...pathMapping.values()]).toEqual([rows[1].path]);
  });

  test('retains recursive folder paths and maps every descendant to its original identity', () => {
    const folder = {
      name: 'team',
      path: 'public/team/',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      items: assets,
    };
    const { treeItems, pathMapping } = generateTreeForDeletingItems(
      [folder],
      [folder] as unknown as DialFile[],
      'Selected',
    );
    expect(treeItems[0].items?.[0].path).toBe('Selected/team/');
    expect(treeItems[0].items?.[0].items).toHaveLength(2);
    expect(pathMapping.get('Selected/team/assistant__stable')).toBe(assets[0].path);
    expect(pathMapping.get('Selected/team/assistant__release candidate')).toBe(assets[1].path);
    expect(pathMapping.get('Selected/team/')).toBe('public/team/');
  });
  test('uses a selected resource even when it has not been fetched', () => {
    expect(
      generateTreeForDeletingItems([], [assets[0]] as unknown as DialFile[], 'Selected').pathMapping.get(
        'Selected/assistant__stable',
      ),
    ).toBe(assets[0].path);
  });
});
