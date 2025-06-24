import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { downloadFile } from '../download';

const mockUrl = 'blob:http://example.com/fake-blob';
describe('Utils :: downloadFile', () => {
  let createObjectURLSpy: vi.SpyInstance;
  let revokeObjectURLSpy: vi.SpyInstance;

  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => mockUrl);
    global.URL.revokeObjectURL = vi.fn();
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('creates a download link, triggers click, and revokes URL', () => {
    const blob = new Blob(['test content'], { type: 'text/plain' });

    const link = document.createElement('a');
    const clickSpy = vi.spyOn(link, 'click');

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

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
