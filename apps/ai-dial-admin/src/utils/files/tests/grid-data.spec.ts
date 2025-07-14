import { describe, expect, test } from 'vitest';
import { getGridFileData } from '../grid-data';

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
