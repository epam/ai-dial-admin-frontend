import { CONTENT_DISPOSITION_HEADER, getFileName } from '../get-file-name';

describe('Utils :: getFileName', () => {
  it('Should return undefined', () => {
    const result = getFileName(new Response(null, { headers: { [CONTENT_DISPOSITION_HEADER]: 'test' } }));
    expect(result).toBeUndefined();
  });

  it('Should return Undefined', () => {
    const result = getFileName(
      new Response(null, { headers: { [CONTENT_DISPOSITION_HEADER]: 'test filename="file.json"' } }),
    );
    expect(result).toBe('file.json');
  });
});
