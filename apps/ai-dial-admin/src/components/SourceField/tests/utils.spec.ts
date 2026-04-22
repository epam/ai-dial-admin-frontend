import { describe, expect, test } from 'vitest';
import { isValidSourceField } from '../utils';
import { SOURCE_TYPE } from '../types';
import { Toolset } from '@/src/models/dial/toolset';
import { DialApplication } from '@/src/models/dial/application';

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
