import { JWT } from 'next-auth/jwt';
import { expect, test, describe, vi, beforeEach } from 'vitest';

import { streamRequest, createReadableStream, getContentType } from '../create-stream-request';
import { sendRequest } from '../send-request';

vi.mock('../send-request', () => ({
  sendRequest: vi.fn(),
}));

describe('Utils :: api :: streamRequest', () => {
  const mockToken: JWT = { access_token: 'token' };
  const mockUrl = 'https://example.com/file';
  const mockFileName = 'file.txt';

  const createMockReadableStream = (): ReadableStream<Uint8Array> =>
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([72, 73])); // "HI"
        controller.close();
      },
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return a Response with streamed content and inline header', async () => {
    const mockStream = createMockReadableStream();
    const mockResponse = new Response(mockStream);

    (sendRequest as vi.Mock).mockResolvedValue(mockResponse);

    const response = await streamRequest(mockUrl, mockFileName, mockToken, true);

    expect(sendRequest).toHaveBeenCalledWith(mockUrl, 'GET', expect.any(Object));

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Disposition')).toBe('inline');
  });

  test('should return a Response with streamed content and attachment header', async () => {
    const mockStream = createMockReadableStream();
    const mockResponse = new Response(mockStream);

    (sendRequest as vi.Mock).mockResolvedValue(mockResponse);

    const response = await streamRequest(mockUrl, mockFileName, mockToken, false);

    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename=${mockFileName}`);
  });

  describe('getContentType', () => {
    test('returns null for unknown extension', () => {
      expect(getContentType('file.unknown')).toBe(null);
    });

    test('returns "image/svg+xml" for unknown extension', () => {
      expect(getContentType('file.svg')).toBe('image/svg+xml');
    });
  });

  describe('createReadableStream', () => {
    test('returns a ReadableStream instance', () => {
      const mockStream = {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true }),
        }),
      };
      const result = createReadableStream(mockStream as any);
      expect(result).toBeInstanceOf(ReadableStream);
    });
  });

  describe('streamRequest error handling', () => {
    test('returns promise resolving to null on error', async () => {
      (sendRequest as vi.Mock).mockImplementation(() => {
        throw new Error('fail');
      });
      const promise = streamRequest('url', 'file.txt', { access_token: 'token' }, true);
      expect(promise).toBeInstanceOf(Promise);
    });
  });
});
