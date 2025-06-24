import { describe, expect, test } from 'vitest';
import { getGridFileData, getNameExtensionFromFile } from './files-list';

describe('Files list :: getNameExtensionFromFile', () => {
  test('Should return name and extension', () => {
    const res = getNameExtensionFromFile('file.jpg');
    expect(res).toEqual({ name: 'file', extension: '.jpg' });
  });

  test('Should return name', () => {
    const res = getNameExtensionFromFile('file');
    expect(res).toEqual({ name: 'file', extension: '' });
  });
});

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
