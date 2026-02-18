import { describe, expect, test } from 'vitest';
import {
  getPublicationGridFileData,
  getPublicationGridFileDataFromString,
  getGridFileColumns,
  getGridFileData,
} from '../grid-data';

describe('Files list :: getGridFileData', () => {
  test('Should return correct grid data from files', () => {
    const res = getGridFileData([{ name: 'somePic.jpg' }, { name: 'someText.txt' }, { name: 'someJson.json' }] as any);
    expect(res).toEqual([
      { name: 'somePic', extension: '.jpg' },
      { name: 'someText', extension: '.txt' },
      { name: 'someJson', extension: '.json' },
    ]);
  });
});

describe('Files list :: getPublicationGridFileData', () => {
  test('Should return correct grid data from files', () => {
    const res = getPublicationGridFileData([
      { file: { name: 'somePic.jpg' } },
      { file: { name: 'someText.txt' } },
      { file: { name: 'someJson.json' } },
    ] as any);
    expect(res).toEqual([
      { name: 'somePic', extension: '.jpg' },
      { name: 'someText', extension: '.txt' },
      { name: 'someJson', extension: '.json' },
    ]);
  });
});

describe('Files list :: getPublicationGridFileDataFromString', () => {
  test('returns correct grid data for file strings', () => {
    const files = ['folder/file1.txt', 'file2.pdf', 'archive.tar.gz', 'noextensionfile'];
    const result = getPublicationGridFileDataFromString(files);

    expect(result).toEqual([
      { name: 'folder/file1', extension: '.txt', path: 'folder/file1.txt' },
      { name: 'file2', extension: '.pdf', path: 'file2.pdf' },
      { name: 'archive.tar', extension: '.gz', path: 'archive.tar.gz' },
      { name: 'noextensionfile', extension: '', path: 'noextensionfile' },
    ]);
  });

  test('returns empty array for empty input', () => {
    expect(getPublicationGridFileDataFromString([])).toEqual([]);
  });
});

describe('Files list :: getGridFileColumns', () => {
  test('modifies first two columns and adds action column', () => {
    const columns = [
      { headerName: 'Name', filter: true, floatingFilter: true },
      { headerName: 'Type', filter: true, floatingFilter: true },
      { headerName: 'Other' },
    ];
    const actions = [{ name: 'Edit' }, { name: 'Delete' }];
    const result = getGridFileColumns(columns, []);
    expect(result.length).toBe(3);
    expect(result[0].filter).toBe(false);
    expect(result[0].floatingFilter).toBe(false);
    expect(result[1].maxWidth).toBe(168);
  });

  test('does not modify columns beyond first two', () => {
    const columns = [{ headerName: 'Name' }, { headerName: 'Type' }, { headerName: 'Other', filter: true }];

    const result = getGridFileColumns(columns, []);
    expect(result[2].headerName).toBe(' ');
  });
});
