import { describe, expect, test } from 'vitest';
import { isValidSourceField } from '../utils';
import { SOURCE_TYPE } from '../types';
import { Toolset } from '@/src/models/dial/toolset';

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
});
