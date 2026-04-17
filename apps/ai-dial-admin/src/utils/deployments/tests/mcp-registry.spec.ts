import { describe, expect, test } from 'vitest';
import {
  getPreferredOciPackage,
  getPreferredRemote,
  mapRemoteTransportType,
  mapTransportType,
  unwrapSingleServerResponse,
} from '../mcp-registry';
import { McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';

const makeServer = (overrides: Partial<McpServer> = {}): McpServer => ({
  name: 'test/server',
  description: 'test',
  version: '1.0.0',
  ...overrides,
});

describe('getPreferredOciPackage', () => {
  test('prefers streamable-http over sse', () => {
    const server = makeServer({
      packages: [
        { registryType: 'oci', identifier: 'img-sse:1.0', transport: { type: 'sse' } },
        { registryType: 'oci', identifier: 'img-http:1.0', transport: { type: 'streamable-http' } },
      ],
    });
    expect(getPreferredOciPackage(server)?.identifier).toBe('img-http:1.0');
  });

  test('returns sse package when no streamable-http', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'img:1.0', transport: { type: 'sse' } }],
    });
    expect(getPreferredOciPackage(server)?.transport?.type).toBe('sse');
  });

  test('skips non-OCI packages', () => {
    const server = makeServer({
      packages: [
        { registryType: 'npm', identifier: 'pkg', transport: { type: 'streamable-http' } },
        { registryType: 'oci', identifier: 'img:1.0', transport: { type: 'sse' } },
      ],
    });
    expect(getPreferredOciPackage(server)?.registryType).toBe('oci');
  });

  test('returns undefined when no OCI package with supported transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'img:1.0', transport: { type: 'stdio' } }],
    });
    expect(getPreferredOciPackage(server)).toBeUndefined();
  });

  test('returns undefined when no packages', () => {
    expect(getPreferredOciPackage(makeServer())).toBeUndefined();
  });
});

describe('mapTransportType', () => {
  test('maps streamable-http to HTTP', () => {
    expect(mapTransportType('streamable-http')).toBe(CONTAINER_TRANSPORT.HTTP);
  });

  test('maps sse to SSE', () => {
    expect(mapTransportType('sse')).toBe(CONTAINER_TRANSPORT.SSE);
  });

  test('returns undefined for unknown type', () => {
    expect(mapTransportType('grpc')).toBeUndefined();
  });
});

describe('getPreferredRemote', () => {
  test('prefers streamable-http over sse', () => {
    const server = makeServer({
      remotes: [
        { type: 'sse', url: 'https://sse.example.com' },
        { type: 'streamable-http', url: 'https://http.example.com' },
      ],
    });
    expect(getPreferredRemote(server)?.url).toBe('https://http.example.com');
  });

  test('returns sse remote when no streamable-http', () => {
    const server = makeServer({
      remotes: [{ type: 'sse', url: 'https://sse.example.com' }],
    });
    expect(getPreferredRemote(server)?.type).toBe('sse');
  });

  test('skips unsupported remote types', () => {
    const server = makeServer({
      remotes: [
        { type: 'websocket', url: 'https://ws.example.com' },
        { type: 'streamable-http', url: 'https://http.example.com' },
      ],
    });
    expect(getPreferredRemote(server)?.type).toBe('streamable-http');
  });

  test('returns undefined when no compatible remotes', () => {
    const server = makeServer({
      remotes: [{ type: 'websocket', url: 'https://ws.example.com' }],
    });
    expect(getPreferredRemote(server)).toBeUndefined();
  });

  test('returns undefined when no remotes', () => {
    expect(getPreferredRemote(makeServer())).toBeUndefined();
  });
});

describe('mapRemoteTransportType', () => {
  test('maps streamable-http to HTTP', () => {
    expect(mapRemoteTransportType('streamable-http')).toBe(ToolsetTransport.HTTP);
  });

  test('maps sse to SSE', () => {
    expect(mapRemoteTransportType('sse')).toBe(ToolsetTransport.SSE);
  });

  test('returns undefined for unknown type', () => {
    expect(mapRemoteTransportType('grpc')).toBeUndefined();
  });
});

describe('unwrapSingleServerResponse', () => {
  const singleItem: McpServerResponse = {
    server: makeServer({ name: 'ai.aliengiraffe/spotdb', version: 'v0.1.0' }),
    _meta: { published: true },
  };

  test('returns the first server from a single-item list', () => {
    const result = unwrapSingleServerResponse({
      success: true,
      response: { servers: [singleItem], metadata: { count: 1 } },
    });
    expect(result.success).toBe(true);
    expect(result.response).toEqual(singleItem);
  });

  test('returns undefined when servers array is empty', () => {
    const result = unwrapSingleServerResponse({
      success: true,
      response: { servers: [], metadata: { count: 0 } },
    });
    expect(result.success).toBe(true);
    expect(result.response).toBeUndefined();
  });

  test('returns undefined when response is missing', () => {
    const result = unwrapSingleServerResponse({ success: true });
    expect(result.success).toBe(true);
    expect(result.response).toBeUndefined();
  });

  test('passes through failed upstream response unchanged', () => {
    const failed = {
      success: false,
      errorHeader: 'Not found',
      errorMessage: 'Server version not found',
    };
    expect(unwrapSingleServerResponse(failed)).toEqual(failed);
  });
});
