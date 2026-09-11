import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteType } from '@/src/models/evaluation/test-suite';

import {
  getSuiteApplicationName,
  resolveRunDeployment,
  resolveSuiteContextForDeploymentLink,
} from '../resolve-run-deployment';

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
  test('resolves MCP container link for McpTool suites with a flat id', () => {
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

  test('resolves asset toolset link for McpTool suites with a toolsets/ id', () => {
    expect(
      resolveRunDeployment(
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: {
            id: 'toolsets/public/developers/sf_test/calculator__1.0.0',
            type: 'dial-toolset',
            name: 'calculator',
          },
        } as never,
        undefined,
      ),
    ).toEqual({
      name: 'calculator',
      route: ApplicationRoute.AssetsToolsets,
      entity: {
        name: 'calculator',
        path: 'public/developers/sf_test/calculator__1.0.0',
      },
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

  test('resolves model navigation from deployment type and modelRoute', () => {
    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'gpt-4', name: 'GPT-4' },
        } as never,
        DeploymentType.Model,
      ),
    ).toBeNull();

    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'gpt-4', name: 'GPT-4' },
        } as never,
        DeploymentType.Model,
        ApplicationRoute.Models,
      ),
    ).toEqual({
      name: 'GPT-4',
      route: ApplicationRoute.Models,
      entity: { name: 'gpt-4' },
    });

    expect(
      resolveRunDeployment(
        {
          deploymentRef: { id: 'msh-responses', name: 'msh-responses' },
        } as never,
        DeploymentType.Model,
        ApplicationRoute.PlatformModels,
      ),
    ).toEqual({
      name: 'msh-responses',
      route: ApplicationRoute.PlatformModels,
      entity: { name: 'msh-responses' },
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

describe('resolveSuiteContextForDeploymentLink', () => {
  test('prefers live suite asset mcpDeploymentRef over incomplete snapshot path', () => {
    expect(
      resolveSuiteContextForDeploymentLink(
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: {
            id: 'toolsets/public/sf_test/calculator__1.0.0',
            type: 'dial-toolset',
            name: 'calculator',
          },
        },
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: {
            id: 'toolsets/public/developers/sf_test/calculator__1.0.0',
            type: 'dial-toolset',
            name: 'calculator',
          },
        },
      ),
    ).toEqual({
      suiteType: SuiteType.McpTool,
      mcpDeploymentRef: {
        id: 'toolsets/public/developers/sf_test/calculator__1.0.0',
        type: 'dial-toolset',
        name: 'calculator',
      },
    });
  });

  test('keeps snapshot when live suite has no asset mcp path', () => {
    expect(
      resolveSuiteContextForDeploymentLink(
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: { id: 'mcp-1', type: 'dial-toolset', name: 'MCP Server' },
        },
        {
          suiteType: SuiteType.McpTool,
          mcpDeploymentRef: { id: 'mcp-1', type: 'dial-toolset', name: 'MCP Server' },
        },
      ),
    ).toEqual({
      suiteType: SuiteType.McpTool,
      mcpDeploymentRef: { id: 'mcp-1', type: 'dial-toolset', name: 'MCP Server' },
    });
  });
});
