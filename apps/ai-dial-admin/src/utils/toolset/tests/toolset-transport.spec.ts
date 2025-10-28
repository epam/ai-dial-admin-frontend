import { describe, it, expect } from 'vitest';
import { getTransport, getAllowTools } from '../toolset-transport';
import { ToolsetTransport } from '@/src/types/toolset';

describe('toolset-transport utils', () => {
  it('getTransport returns HTTP for http endpoint', () => {
    expect(getTransport({ endpoint: 'http://example.com' } as any)).toBe(ToolsetTransport.HTTP);
  });
  it('getTransport returns HTTP for https endpoint', () => {
    expect(getTransport({ endpoint: 'https://example.com' } as any)).toBe(ToolsetTransport.HTTP);
  });
  it('getTransport returns SSE for other endpoint', () => {
    expect(getTransport({ endpoint: 'ws://example.com' } as any)).toBe(ToolsetTransport.SSE);
    expect(getTransport({ endpoint: undefined } as any)).toBe(ToolsetTransport.SSE);
  });

  it('getAllowTools filters out empty strings', () => {
    expect(getAllowTools({ allowedTools: ['a', '', 'b'] } as any)).toEqual(['a', 'b']);
  });
  it('getAllowTools returns empty array if allowedTools is undefined', () => {
    expect(getAllowTools({} as any)).toEqual(undefined);
  });
});
