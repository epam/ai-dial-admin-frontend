import { describe, expect, test } from 'vitest';
import { getPreferredOciPackage, getPreferredRemote, mapRemoteTransportType, mapTransportType } from '../mcp-registry';
import { McpServer } from '@/src/types/deployments/mcp-registry';
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
