import { downloadFile } from '../download';

const mockUrl = 'blob:http://example.com/fake-blob';
describe('Utils :: downloadFile', () => {
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;

  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => mockUrl);
    global.URL.revokeObjectURL = jest.fn();
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a download link, triggers click, and revokes URL', () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });

    const link = document.createElement('a');
    const clickSpy = jest.spyOn(link, 'click');

    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(link);
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    downloadFile(blob, 'example.txt');

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(link.href).toBe(mockUrl);
    expect(link.download).toBe('example.txt');
    expect(appendSpy).toHaveBeenCalledWith(link);
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith(link);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});
