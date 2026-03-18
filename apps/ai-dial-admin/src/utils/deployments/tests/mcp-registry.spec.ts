import { describe, expect, test } from 'vitest';
import {
  hasOciPackage,
  hasSupportedTransport,
  isServerSelectable,
  getPreferredOciPackage,
  mapTransportType,
} from '../mcp-registry';
import { McpServer } from '@/src/types/deployments/mcp-registry';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';

const makeServer = (overrides: Partial<McpServer> = {}): McpServer => ({
  name: 'test/server',
  description: 'test',
  version: '1.0.0',
  ...overrides,
});

describe('hasOciPackage', () => {
  test('returns true when server has OCI package', () => {
    const server = makeServer({ packages: [{ registryType: 'oci', identifier: 'docker.io/img:1.0' }] });
    expect(hasOciPackage(server)).toBe(true);
  });

  test('returns false when server has no OCI package', () => {
    const server = makeServer({ packages: [{ registryType: 'npm', identifier: '@scope/pkg' }] });
    expect(hasOciPackage(server)).toBe(false);
  });

  test('returns false when packages is undefined', () => {
    expect(hasOciPackage(makeServer())).toBe(false);
  });

  test('returns false when packages is empty', () => {
    expect(hasOciPackage(makeServer({ packages: [] }))).toBe(false);
  });
});

describe('hasSupportedTransport', () => {
  test('returns true for OCI package with streamable-http transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'img:1.0', transport: { type: 'streamable-http' } }],
    });
    expect(hasSupportedTransport(server)).toBe(true);
  });

  test('returns true for OCI package with sse transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'img:1.0', transport: { type: 'sse' } }],
    });
    expect(hasSupportedTransport(server)).toBe(true);
  });

  test('returns false for OCI package with stdio transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'img:1.0', transport: { type: 'stdio' } }],
    });
    expect(hasSupportedTransport(server)).toBe(false);
  });

  test('returns false for non-OCI package with supported transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'npm', identifier: 'pkg', transport: { type: 'streamable-http' } }],
    });
    expect(hasSupportedTransport(server)).toBe(false);
  });

  test('returns false when packages is undefined', () => {
    expect(hasSupportedTransport(makeServer())).toBe(false);
  });

  test('returns true when at least one OCI package has supported transport among mixed packages', () => {
    const server = makeServer({
      packages: [
        { registryType: 'oci', identifier: 'img:1.0', transport: { type: 'stdio' } },
        { registryType: 'oci', identifier: 'img:1.0', transport: { type: 'streamable-http' } },
      ],
    });
    expect(hasSupportedTransport(server)).toBe(true);
  });
});

describe('isServerSelectable', () => {
  test('returns true when server has OCI package with supported transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'docker.io/img:1.0', transport: { type: 'streamable-http' } }],
    });
    expect(isServerSelectable(server)).toBe(true);
  });

  test('returns false when server has OCI but only stdio transport', () => {
    const server = makeServer({
      packages: [{ registryType: 'oci', identifier: 'docker.io/img:1.0', transport: { type: 'stdio' } }],
    });
    expect(isServerSelectable(server)).toBe(false);
  });

  test('returns false when server has no OCI package', () => {
    const server = makeServer({
      packages: [{ registryType: 'npm', identifier: 'pkg', transport: { type: 'streamable-http' } }],
    });
    expect(isServerSelectable(server)).toBe(false);
  });

  test('returns false when server has neither', () => {
    expect(isServerSelectable(makeServer())).toBe(false);
  });
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
