import { DeploymentType } from '@/src/models/evaluation/deployment';
import { ApplicationRoute } from '@/src/types/routes';
import {
  resolveCatalogDeploymentNavigation,
  resolveDeploymentNavigationTarget,
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

  test('routes entity applications through Applications', () => {
    expect(
      resolveCatalogDeploymentNavigation({
        application: 'my-app',
        reference: 'my-app',
        displayName: 'My App',
      }),
    ).toEqual({
      route: ApplicationRoute.Applications,
      entity: { name: 'my-app' },
    });
  });

  test('routes asset applications through AssetsApplications with path', () => {
    expect(
      resolveCatalogDeploymentNavigation({
        application: 'applications/folder/my-app__1.0.0',
        reference: 'published-app',
        displayName: 'My Asset App',
      }),
    ).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My Asset App', path: 'folder/my-app__1.0.0' },
    });
  });

  test('uses fallbackDisplayName when displayName is missing for asset apps', () => {
    expect(
      resolveCatalogDeploymentNavigation(
        {
          application: 'applications/folder/my-app__1.0.0',
          reference: 'published-app',
        },
        { fallbackDisplayName: 'Fallback Name' },
      ),
    ).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'Fallback Name', path: 'folder/my-app__1.0.0' },
    });
  });
});

describe('resolveDeploymentNavigationTarget', () => {
  test('returns null when deployment id is missing', () => {
    expect(resolveDeploymentNavigationTarget({ name: 'App' }, DeploymentType.Application)).toBeNull();
  });

  test('routes entity applications through Applications', () => {
    const result = resolveDeploymentNavigationTarget({ id: 'my-app', name: 'My App' }, DeploymentType.Application, [
      { application: 'my-app', reference: 'my-app', displayName: 'My App' },
    ]);

    expect(result).toEqual({
      route: ApplicationRoute.Applications,
      entity: { name: 'my-app' },
    });
  });

  test('routes asset applications through AssetsApplications with path', () => {
    const result = resolveDeploymentNavigationTarget(
      { id: 'published-app', name: 'My Asset App' },
      DeploymentType.Application,
      [
        {
          application: 'applications/folder/my-app__1.0.0',
          reference: 'published-app',
          displayName: 'My Asset App',
        },
      ],
    );

    expect(result).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My Asset App', path: 'folder/my-app__1.0.0' },
    });
  });

  test('routes models through Models using catalog deployment model field', () => {
    const result = resolveDeploymentNavigationTarget(
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      DeploymentType.Model,
      [{ model: 'gemini-2.5-flash', reference: 'gemini-2.5-flash' }],
    );

    expect(result).toEqual({
      route: ApplicationRoute.Models,
      entity: { name: 'gemini-2.5-flash' },
    });
  });

  test('falls back to deployment type when catalog deployment is missing', () => {
    expect(
      resolveDeploymentNavigationTarget({ id: 'entity-app', name: 'Entity App' }, DeploymentType.Application, []),
    ).toEqual({
      route: ApplicationRoute.Applications,
      entity: { name: 'entity-app' },
    });

    expect(
      resolveDeploymentNavigationTarget({ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }, DeploymentType.Model, []),
    ).toEqual({
      route: ApplicationRoute.Models,
      entity: { name: 'gemini-2.5-flash' },
    });
  });

  test('falls back to AssetsApplications when deployment id is an applications path', () => {
    const result = resolveDeploymentNavigationTarget(
      { id: 'applications/folder/my-app__1.0.0', name: 'My Asset App' },
      DeploymentType.Application,
      [],
    );

    expect(result).toEqual({
      route: ApplicationRoute.AssetsApplications,
      entity: { name: 'My Asset App', path: 'folder/my-app__1.0.0' },
    });
  });
});
