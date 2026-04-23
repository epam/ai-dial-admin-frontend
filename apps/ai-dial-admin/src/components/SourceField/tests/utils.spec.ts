import { describe, expect, test } from 'vitest';
import { buildContainerSelection, isValidSourceField } from '../utils';

import { SOURCE_TYPE } from '../types';
import { Toolset } from '@/src/models/dial/toolset';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_STATUS, CONTAINER_SOURCE_TYPE, CONTAINER_TYPE } from '@/src/types/deployments/containers';

describe('isValidSourceField', () => {
  describe('MCP_REGISTRY source type', () => {
    test('returns true when serverName is present', () => {
      const toolset = {
        source: {
          $type: SOURCE_TYPE.MCP_REGISTRY,
          serverName: 'io.github.user/weather',
          serverVersion: '1.0.0',
        },
      } as Toolset;
      expect(isValidSourceField(toolset)).toBe(true);
    });

    test('returns false when serverName is empty', () => {
      const toolset = {
        source: {
          $type: SOURCE_TYPE.MCP_REGISTRY,
          serverName: '',
        },
      } as Toolset;
      expect(isValidSourceField(toolset)).toBe(false);
    });

    test('returns false when serverName is undefined', () => {
      const toolset = {
        source: {
          $type: SOURCE_TYPE.MCP_REGISTRY,
        },
      } as Toolset;
      expect(isValidSourceField(toolset)).toBe(false);
    });
  });

  describe('SCHEMA source type (DialApplication)', () => {
    test('returns true when applicationTypeSchemaId is present', () => {
      const app = {
        source: {
          $type: SOURCE_TYPE.SCHEMA,
          applicationTypeSchemaId: 'urn:app-schema:123',
        },
        mcp: undefined,
      } as unknown as DialApplication;
      expect(isValidSourceField(app)).toBe(true);
    });

    test('returns false when applicationTypeSchemaId is missing', () => {
      const app = {
        source: {
          $type: SOURCE_TYPE.SCHEMA,
        },
        mcp: undefined,
      } as unknown as DialApplication;
      expect(isValidSourceField(app)).toBe(false);
    });

    test('returns false when applicationTypeSchemaId is empty string', () => {
      const app = {
        source: {
          $type: SOURCE_TYPE.SCHEMA,
          applicationTypeSchemaId: '',
        },
        mcp: undefined,
      } as unknown as DialApplication;
      expect(isValidSourceField(app)).toBe(false);
    });
  });

  describe('ENDPOINTS source type (DialApplication)', () => {
    const makeApp = (fields: Partial<DialApplication>): DialApplication =>
      ({
        source: { $type: SOURCE_TYPE.ENDPOINTS },
        ...fields,
      }) as unknown as DialApplication;

    test('returns true when only chat endpoint is a valid URL', () => {
      const app = makeApp({ endpoint: 'https://chat.example.com/v1/completions' });
      expect(isValidSourceField(app)).toBe(true);
    });

    test('returns true when only MCP endpoint is a valid URL', () => {
      const app = makeApp({ mcp: { endpoint: 'https://mcp.example.com/sse' } });
      expect(isValidSourceField(app)).toBe(true);
    });

    test('returns true when both chat and MCP endpoints are valid URLs', () => {
      const app = makeApp({
        endpoint: 'https://chat.example.com/v1/completions',
        mcp: { endpoint: 'https://mcp.example.com/sse' },
      });
      expect(isValidSourceField(app)).toBe(true);
    });

    test('returns false when both chat and MCP endpoints are invalid', () => {
      const app = makeApp({
        endpoint: 'not a url',
        mcp: { endpoint: 'also not a url' },
      });
      expect(isValidSourceField(app)).toBe(false);
    });

    test('returns false when neither chat nor MCP endpoint is set', () => {
      const app = makeApp({});
      expect(isValidSourceField(app)).toBe(false);
    });

    test('returns true when chat is valid and MCP is invalid', () => {
      const app = makeApp({
        endpoint: 'https://chat.example.com/v1/completions',
        mcp: { endpoint: 'garbage' },
      });
      expect(isValidSourceField(app)).toBe(true);
    });
  });
});

const makeContainer = (overrides: Partial<Container> = {}): Container => ({
  name: 'app-container',
  displayName: 'App Container',
  $type: CONTAINER_TYPE.APPLICATION,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.RUNNING,
  url: 'http://app-container.internal/',
  metadata: { envs: [] },
  ...overrides,
});

describe('buildContainerSelection', () => {
  test('Applications: writes containerId, does not clear endpoint fields', () => {
    const entity = {
      name: 'app',
      mcp: undefined,
      source: { $type: SOURCE_TYPE.CONTAINER },
    } as unknown as DialApplication;
    const container = makeContainer();

    const result = buildContainerSelection(ApplicationRoute.Applications, entity, 'app-container', container);

    expect(result.source?.containerId).toBe('app-container');
    expect('endpoint' in result).toBe(false);
    expect('baseEndpoint' in result).toBe(false);
  });

  test('Applications: containerId is set even when container is not found', () => {
    const entity = {
      name: 'app',
      mcp: undefined,
      source: { $type: SOURCE_TYPE.CONTAINER },
    } as unknown as DialApplication;

    const result = buildContainerSelection(ApplicationRoute.Applications, entity, 'missing', undefined);

    expect(result.source?.containerId).toBe('missing');
  });

  test('Models: writes containerId and completionEndpointPath, clears endpoint fields', () => {
    const entity: DialModel = {
      name: 'model',
      type: DialModelType.Chat,
      endpoint: 'https://old.example.com',
      source: { $type: SOURCE_TYPE.CONTAINER },
    } as unknown as DialModel;
    const container = makeContainer({ $type: CONTAINER_TYPE.NIM });

    const result = buildContainerSelection(ApplicationRoute.Models, entity, 'app-container', container) as DialModel;

    expect(result.source?.containerId).toBe('app-container');
    expect(result.source?.completionEndpointPath).toBeTruthy();
    expect(result.endpoint).toBe('');
    expect(result.baseEndpoint).toBe('');
  });

  test('default (Interceptors): writes containerId, clears endpoint, no completionEndpointPath', () => {
    const entity = {
      name: 'interceptor',
      endpoint: 'https://old.example.com',
      source: { $type: SOURCE_TYPE.CONTAINER },
    } as unknown as DialInterceptor;
    const container = makeContainer();

    const result = buildContainerSelection(ApplicationRoute.Interceptors, entity, 'app-container', container);

    expect(result.source?.containerId).toBe('app-container');
    expect(result.source?.completionEndpointPath).toBeUndefined();
    expect((result as DialInterceptor).endpoint).toBe('');
  });
});
