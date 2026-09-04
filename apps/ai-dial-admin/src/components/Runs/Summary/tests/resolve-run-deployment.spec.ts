import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { DeploymentType } from '@/src/models/evaluation/deployment';
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
      ),
    ).toEqual({
      name: 'MCP Server',
      route: ApplicationRoute.McpContainers,
      entity: { name: 'mcp-1' },
    });
  });

  test('resolves application navigation from deployment type', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'ref-1', name: 'My App' },
        } as never,
        DeploymentType.Application,
      ),
    ).toEqual({
      name: 'My App',
      route: ApplicationRoute.Applications,
      entity: { name: 'ref-1' },
    });
  });

  test('resolves model navigation from deployment type', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'gpt-4', name: 'GPT-4' },
        } as never,
        DeploymentType.Model,
      ),
    ).toEqual({
      name: 'GPT-4',
      route: ApplicationRoute.Models,
      entity: { name: 'gpt-4' },
    });
  });

  test('resolves assets applications from applications/ id prefix', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'applications/folder/my-app__1.0.0', name: 'My Asset App' },
        } as never,
        DeploymentType.Application,
      ),
    ).toEqual({
      name: 'My Asset App',
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My Asset App', path: 'folder/my-app__1.0.0' },
    });
  });

  test('returns null without deployment type', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'ref-1', name: 'My App' },
        } as never,
        undefined,
      ),
    ).toBeNull();
  });
});
