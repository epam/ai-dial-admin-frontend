import { IMPORT_RESOLUTIONS } from '../import';
import { ImportFileTypes } from '@/src/types/import';

describe('Prompts list :: IMPORT_RESOLUTIONS', () => {
  const mockT = jest.fn().mockReturnValue('Translated Text');
  it('Should return 2 resolutions', () => {
    const res = IMPORT_RESOLUTIONS(mockT);
    expect(res.length).toEqual(2);
  });

  it('Should return 3 resolutions', () => {
    const res = IMPORT_RESOLUTIONS(mockT, ImportFileTypes.JSON);
    expect(res.length).toEqual(3);
  });
});
