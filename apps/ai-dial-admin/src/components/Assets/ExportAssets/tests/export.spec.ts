import { describe, expect, test } from 'vitest';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import {
  changeExportFileData,
  changeExportGridData,
  changeExportAssetData,
  generateExportList,
  generateRowDataForExportGrid,
  getExportGridData,
  findAssetMatch,
} from '@/src/components/Assets/ExportAssets/export';

const assets: AssetWithVersion[] = ['stable', 'release candidate, 未来'].map((version) => ({
  name: 'assistant',
  version,
  path: `public/team/assistant__${version}`,
  folderId: 'public/team/',
  nodeType: DialFileNodeType.ITEM,
}));

describe('generateRowDataForExportGrid', () => {
  test('retains every complete path and scalar version even when a sibling is selected', () => {
    expect(generateRowDataForExportGrid(assets, [assets[0]])).toEqual(assets);
    expect(generateRowDataForExportGrid()).toEqual([]);
  });
});

describe('findAssetMatch', () => {
  test('matches only the selected path instead of interpreting commas or sibling names', () => {
    expect(findAssetMatch(assets[1], assets)).toEqual([assets[1]]);
    expect(findAssetMatch({ ...assets[1], path: 'public/missing' }, assets)).toEqual([]);
  });
});

describe('changeExportAssetData', () => {
  test('exports only the exact selected resource', () => {
    expect(changeExportAssetData([assets[1]], { 'public/team/': assets }, 'public/team/', {})).toEqual({
      'public/team/': [assets[1]],
    });
  });
  test('removes an empty selection without changing another folder', () => {
    expect(changeExportAssetData([], { folder: assets }, 'folder', { folder: assets, other: [assets[0]] })).toEqual({
      other: [assets[0]],
    });
  });
  test('retains a selected folder as a recursive export path', () => {
    const folder = {
      name: 'team',
      version: '',
      path: 'public/team/',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
    };
    expect(changeExportAssetData([folder], { 'public/': [folder] }, 'public/', {})).toEqual({ 'public/': [folder] });
  });
});

describe('changeExportFileData', () => {
  test('retains file-name and extension matching', () => {
    const selected: DialFile = { name: 'photo', extension: '.jpg', path: 'public/photo.jpg', folderId: 'public/' };
    const fetched = { ...selected, name: 'photo.jpg' };
    expect(changeExportFileData([selected], { 'public/': [fetched] }, 'public/', {})).toEqual({ 'public/': [fetched] });
  });
  test('returns an empty selection when no files are selected', () => {
    expect(changeExportFileData([], {}, 'public/', {})).toEqual({});
  });
});

describe('generateExportList', () => {
  test('keeps every selected complete path and folder', () => {
    expect(generateExportList({ team: assets })).toEqual(assets.map((asset) => asset.path));
    expect(generateExportList()).toEqual([]);
  });
});

describe('getExportGridData', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'retains both same-name rows for %s',
    (view) => {
      expect(getExportGridData(view, assets, [assets[0]])).toEqual(assets);
    },
  );
  test('keeps prompts as independent versionless rows', () => {
    const prompts = [{ name: 'prompt__literal', path: 'public/prompt__literal', folderId: 'public/' }];
    expect(getExportGridData(ApplicationRoute.Prompts, prompts)).toEqual(prompts);
    expect(changeExportGridData(ApplicationRoute.Prompts, { folder: prompts }, {}, prompts, 'folder')).toEqual({
      folder: prompts,
    });
  });
  test('returns no rows for an unsupported route', () => {
    expect(getExportGridData()).toEqual([]);
    expect(changeExportGridData()).toEqual({});
  });
});

describe('changeExportGridData', () => {
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'selects an exact-path row for %s',
    (view) => {
      expect(changeExportGridData(view, { folder: assets }, {}, [assets[0]], 'folder')).toEqual({
        folder: [assets[0]],
      });
    },
  );
});
