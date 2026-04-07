import { describe, expect, test } from 'vitest';
import { getPreferredOciPackage, mapTransportType } from '../mcp-registry';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';

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
