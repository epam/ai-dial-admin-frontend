import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getDeploymentTypeFromCoreObject,
  resolveCatalogDeploymentNavigation,
  resolveDeploymentNavigationTarget,
  resolveMcpDeploymentNavigationTarget,
  resolveRouteNavigationTarget,
} from '@/src/utils/deployment-navigation';
import { describe, expect, test } from 'vitest';

describe('resolveCatalogDeploymentNavigation', () => {
  test('returns null for null deployment', () => {
    expect(resolveCatalogDeploymentNavigation(null)).toBeNull();
  });

  test('returns null for empty deployment', () => {
    expect(resolveCatalogDeploymentNavigation({})).toBeNull();
  });

  test('routes models through Models', () => {
    expect(resolveCatalogDeploymentNavigation({ model: 'gpt-4' })).toEqual({
      route: ApplicationRoute.Models,
      entity: { name: 'gpt-4' },
    });
  });

  test('waits for the application route probe before routing applications', () => {
    expect(resolveDeploymentNavigationTarget({ id: 'my-app', name: 'My App' }, DeploymentType.Application)).toBeNull();
  });

  test('routes entity applications through the probed application route', () => {
    expect(
      resolveDeploymentNavigationTarget({ id: 'my-app', name: 'My App' }, DeploymentType.Application, {
        applicationRoute: ApplicationRoute.Applications,
      }),
    ).toEqual({
      route: ApplicationRoute.Applications,
      entity: { name: 'my-app' },
    });
  });

  test('routes platform applications through AssetsApplications when probed', () => {
    expect(
      resolveDeploymentNavigationTarget(
        { id: 'world-economy-v2-hybrid', name: 'StatGPT' },
        DeploymentType.Application,
        {
          applicationRoute: ApplicationRoute.AssetsApplications,
        },
      ),
    ).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'world-economy-v2-hybrid' },
    });
  });

  test('routes models through the probed model route', () => {
    expect(
      resolveDeploymentNavigationTarget({ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }, DeploymentType.Model),
    ).toBeNull();

    expect(
      resolveDeploymentNavigationTarget({ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }, DeploymentType.Model, {
        modelRoute: ApplicationRoute.Models,
      }),
    ).toEqual({
      route: ApplicationRoute.Models,
      entity: { name: 'gemini-2.5-flash' },
    });

    expect(
      resolveDeploymentNavigationTarget({ id: 'msh-responses', name: 'msh-responses' }, DeploymentType.Model, {
        modelRoute: ApplicationRoute.PlatformModels,
      }),
    ).toEqual({
      route: ApplicationRoute.PlatformModels,
      entity: { name: 'msh-responses' },
    });
  });

  test('routes models/platform/ ids to PlatformModels', () => {
    expect(
      resolveDeploymentNavigationTarget(
        { id: 'models/platform/msh-responses', name: 'msh-responses' },
        DeploymentType.Model,
      ),
    ).toEqual({
      route: ApplicationRoute.PlatformModels,
      entity: { name: 'msh-responses' },
    });
  });

  test('falls back to AssetsApplications when deployment id is an applications path', () => {
    const result = resolveDeploymentNavigationTarget(
      { id: 'applications/folder/my-app__1.0.0', name: 'My Asset App' },
      DeploymentType.Application,
    );

    expect(result).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My Asset App', path: 'folder/my-app__1.0.0' },
    });
  });
});

describe('resolveMcpDeploymentNavigationTarget', () => {
  test('returns null when mcpDeploymentRef is missing', () => {
    expect(resolveMcpDeploymentNavigationTarget(null)).toBeNull();
    expect(resolveMcpDeploymentNavigationTarget(undefined)).toBeNull();
    expect(resolveMcpDeploymentNavigationTarget({ id: '', type: 'dial-toolset', name: '' })).toBeNull();
  });

  test('routes toolsets/ ids to AssetsToolsets with stripped path', () => {
    expect(
      resolveMcpDeploymentNavigationTarget({
        id: 'toolsets/public/developers/sf_test/calculator__1.0.0',
        type: 'dial-toolset',
        name: 'calculator',
      }),
    ).toEqual({
      route: ApplicationRoute.AssetsToolsets,
      entity: {
        name: 'calculator',
        path: 'public/developers/sf_test/calculator__1.0.0',
      },
    });
  });

  test('routes applications/ ids to AssetsApplications with stripped path', () => {
    expect(
      resolveMcpDeploymentNavigationTarget({
        id: 'applications/folder/my-app__1.0.0',
        type: 'dial-application',
        name: 'My App',
      }),
    ).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My App', path: 'folder/my-app__1.0.0' },
    });
  });

  test('routes flat ids to McpContainers', () => {
    expect(
      resolveMcpDeploymentNavigationTarget({
        id: 'mcp-container-1',
        type: 'dial-toolset',
        name: 'MCP Server',
      }),
    ).toEqual({
      route: ApplicationRoute.McpContainers,
      entity: { name: 'mcp-container-1' },
    });
  });
});

describe('resolveRouteNavigationTarget', () => {
  test('routes a route reference to Platform Routes', () => {
    expect(resolveRouteNavigationTarget({ name: 'routes/platform/search-route' })).toEqual({
      route: ApplicationRoute.PlatformRoutes,
      entity: { name: 'search-route' },
    });
  });

  test('returns null when the route reference is missing', () => {
    expect(resolveRouteNavigationTarget(undefined)).toBeNull();
    expect(resolveRouteNavigationTarget(null)).toBeNull();
    expect(resolveRouteNavigationTarget({ name: '' })).toBeNull();
  });
});

describe('getDeploymentTypeFromCoreObject', () => {
  test.each([
    ['model', DeploymentType.Model],
    ['application', DeploymentType.Application],
  ] as const)('maps %s to its deployment type', (object, expected) => {
    expect(getDeploymentTypeFromCoreObject({ object })).toBe(expected);
  });

  test.each(['toolset', 'router'] as const)('maps %s to no deployment type', (object) => {
    expect(getDeploymentTypeFromCoreObject({ object })).toBeUndefined();
  });

  test('maps a missing deployment to no deployment type', () => {
    expect(getDeploymentTypeFromCoreObject(null)).toBeUndefined();
    expect(getDeploymentTypeFromCoreObject(undefined)).toBeUndefined();
  });
});
