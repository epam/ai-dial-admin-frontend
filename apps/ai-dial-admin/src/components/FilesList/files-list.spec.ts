import { getNameExtensionFromFile, getGridFileData } from './files-list';

describe('Files list :: getNameExtensionFromFile', () => {
  it('Should return name and extension', () => {
    const res = getNameExtensionFromFile('file.jpg');
    expect(res).toEqual({ name: 'file', extension: '.jpg' });
  });

  it('Should return name', () => {
    const res = getNameExtensionFromFile('file');
    expect(res).toEqual({ name: 'file', extension: '' });
  });
});

describe('Files list :: getGridFileData', () => {
  it('Should return correct grid data from files', () => {
    const res = getGridFileData([{ name: 'somePic.jpg' }, { name: 'someText.txt' }, { name: 'someJson.json' }]);
    expect(res).toEqual([
      { name: 'somePic', extension: '.jpg' },
      { name: 'someText', extension: '.txt' },
      { name: 'someJson', extension: '.json' },
    ]);
  });
});
