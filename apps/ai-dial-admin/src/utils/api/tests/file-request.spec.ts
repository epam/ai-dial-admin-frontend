import { describe, test, expect, vi } from 'vitest';
import { fileRequest } from '../file-request';

global.fetch = vi.fn();

const url = 'https://api.example.com/upload';
const headers = { 'Authorization': 'Bearer token' };
const formData = new FormData();
formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

describe('fileRequest', () => {
  test('calls fetch with correct params and default method', async () => {
    (fetch as any).mockResolvedValue('response');
    const result = await fileRequest(url, headers, formData);
    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
      body: formData,
      method: 'POST',
      headers,
    }));
    expect(result).toBe('response');
  });

  test('calls fetch with custom method', async () => {
    (fetch as any).mockResolvedValue('response');
    const result = await fileRequest(url, headers, formData, 'PUT');
    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
      method: 'PUT',
    }));
    expect(result).toBe('response');
  });

  test('returns promise resolving to null on error', async () => {
    (fetch as any).mockImplementation(() => { throw new Error('fail'); });
    const promise = fileRequest(url, headers, formData);
    expect(promise).toBeInstanceOf(Promise);
  });

  test('works with no headers and dto', async () => {
    (fetch as any).mockResolvedValue('response');
    const result = await fileRequest(url);
    expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
      body: undefined,
      headers: undefined,
    }));
    expect(result).toBe('response');
  });
});
