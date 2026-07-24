import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { SuiteType } from '@/src/models/evaluation/test-suite';

import { getSuiteApplicationName, resolveRunDeployment } from '../resolve-run-deployment';

describe('getSuiteApplicationName', () => {
  test('returns deploymentRef name when present', () => {
    expect(
      getSuiteApplicationName({
        deploymentRef: { id: 'app-1', name: 'My App' },
      } as never),
    ).toBe('My App');
  });

  test('returns MCP deployment name for McpTool suites', () => {
    expect(
      getSuiteApplicationName({
        suiteType: SuiteType.McpTool,
        mcpDeploymentRef: { id: 'mcp-1', name: 'MCP Server' },
      } as never),
    ).toBe('MCP Server');
  });

  test('returns empty string when no deployment', () => {
    expect(getSuiteApplicationName(null)).toBe('');
    expect(getSuiteApplicationName(undefined)).toBe('');
  });
});

describe('resolveRunDeployment', () => {
  test('resolves MCP container link for McpTool suites', () => {
    expect(
      resolveRunDeployment(
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: { id: 'mcp-1', name: 'MCP Server' },
        } as never,
        undefined,
        [],
      ),
    ).toEqual({
      name: 'MCP Server',
      route: ApplicationRoute.McpContainers,
      entity: { name: 'mcp-1' },
    });
  });

  test('resolves application navigation from catalog', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'ref-1', name: 'My App' },
        } as never,
        'APPLICATION',
        [{ reference: 'ref-1', application: 'ref-1' }],
      ),
    ).toEqual({
      name: 'My App',
      route: ApplicationRoute.Applications,
      entity: { name: 'ref-1' },
    });
  });

  test('returns null without deployment type and catalog match', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'ref-1', name: 'My App' },
        } as never,
        undefined,
        [],
      ),
    ).toBeNull();
  });
});
