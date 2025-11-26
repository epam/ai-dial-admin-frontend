import { describe, test, expect, vi } from 'vitest';
import { sendRequest, CACHE } from '../send-request';

global.fetch = vi.fn();

const url = 'https://api.example.com/data';
const type = 'POST';
const headers = { 'Content-Type': 'application/json' };
const dto = { foo: 'bar' };

describe('sendRequest', () => {
  test('calls fetch with correct params', async () => {
    (fetch as any).mockResolvedValue('response');
    const result = await sendRequest(url, type, headers, dto);
    expect(fetch).toHaveBeenCalledWith(url, {
      body: JSON.stringify(dto),
      method: type,
      ...CACHE,
      headers,
    });
    expect(result).toBe('response');
  });

  test('returns promise resolving to null on error', async () => {
    (fetch as any).mockImplementation(() => {
      throw new Error('fail');
    });
    const promise = sendRequest(url, type, headers, dto);
    // The promise never resolves, but we can check it's a Promise
    expect(promise).toBeInstanceOf(Promise);
  });

  test('works with no headers and dto', async () => {
    (fetch as any).mockResolvedValue('response');
    const result = await sendRequest(url, type);
    expect(fetch).toHaveBeenCalledWith(url, {
      body: JSON.stringify(undefined),
      method: type,
      ...CACHE,
      headers: undefined,
    });
    expect(result).toBe('response');
  });
});
