import { describe, expect, test } from 'vitest';
import { getGridFileData, getGridFileDataFromString } from '../grid-data';

describe('Files list :: getGridFileData', () => {
  test('Should return correct grid data from files', () => {
    const res = getGridFileData([{ name: 'somePic.jpg' }, { name: 'someText.txt' }, { name: 'someJson.json' }]);
    expect(res).toEqual([
      { name: 'somePic', extension: '.jpg' },
      { name: 'someText', extension: '.txt' },
      { name: 'someJson', extension: '.json' },
    ]);
  });
});

describe('Files list :: getGridFileDataFromString', () => {
  test('returns correct grid data for file strings', () => {
    const files = ['folder/file1.txt', 'file2.pdf', 'archive.tar.gz', 'noextensionfile'];
    const result = getGridFileDataFromString(files);

    expect(result).toEqual([
      { name: 'folder/file1', extension: 'txt', path: 'folder/file1.txt' },
      { name: 'file2', extension: 'pdf', path: 'file2.pdf' },
      { name: 'archive.tar', extension: 'gz', path: 'archive.tar.gz' },
      { name: 'noextensionfile', extension: '', path: 'noextensionfile' },
    ]);
  });

  test('returns empty array for empty input', () => {
    expect(getGridFileDataFromString([])).toEqual([]);
  });
});
