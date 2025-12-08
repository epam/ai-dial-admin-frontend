import { ToolsetTransport } from '@/src/types/toolset';
import { describe, test, expect } from 'vitest';
import { getAllowTools, getTransport } from '../toolset-transport';

describe('toolset-transport utils', () => {
  test('getTransport returns explicit transport when provided', () => {
    expect(getTransport({ transport: ToolsetTransport.SSE, endpoint: 'https://example.com' } as any)).toBe(
      ToolsetTransport.SSE,
    );
    expect(getTransport({ transport: ToolsetTransport.HTTP, endpoint: 'ws://example.com' } as any)).toBe(
      ToolsetTransport.HTTP,
    );
  });
  test('getTransport returns HTTP for http endpoint', () => {
    expect(getTransport({ endpoint: 'http://example.com' } as any)).toBe(ToolsetTransport.HTTP);
  });
  test('getTransport returns HTTP for https endpoint', () => {
    expect(getTransport({ endpoint: 'https://example.com' } as any)).toBe(ToolsetTransport.HTTP);
  });
  test('getTransport returns SSE for other endpoint', () => {
    expect(getTransport({ endpoint: 'ws://example.com' } as any)).toBe(ToolsetTransport.SSE);
    expect(getTransport({ endpoint: undefined } as any)).toBe(ToolsetTransport.SSE);
  });

  test('getAllowTools filters out empty strings', () => {
    expect(getAllowTools({ allowedTools: ['a', '', 'b'] } as any)).toEqual(['a', 'b']);
  });
  test('getAllowTools returns empty array if allowedTools is undefined', () => {
    expect(getAllowTools({} as any)).toEqual(undefined);
  });
});
