import {
  hasTopicCatalogue,
  isAssetView,
  isAssetWithVersion,
  isBuildersView,
  isEntitiesWithDisplayVersion,
  isEvaluationView,
  isToolsetRoute,
  isVersionlessAssetView,
} from '../is-view';
import { describe, expect, test } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';

describe('Utils :: isAssetView', () => {
  test('Should return true', () => {
    const result = isAssetView(ApplicationRoute.Files);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isAssetView(ApplicationRoute.AssetsApplications);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isAssetView(ApplicationRoute.Prompts);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isAssetView(ApplicationRoute.AssetsToolsets);
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isAssetView(ApplicationRoute.Models);
    expect(result).toBeFalsy();
  });
});

describe('Utils :: isEvaluationView', () => {
  test('Should return true', () => {
    expect(isEvaluationView(ApplicationRoute.TestSuites)).toBeTruthy();
    expect(isEvaluationView(ApplicationRoute.Runs)).toBeTruthy();
    expect(isEvaluationView(ApplicationRoute.Metrics)).toBeTruthy();
  });

  test('Should return false', () => {
    expect(isEvaluationView(ApplicationRoute.Models)).toBeFalsy();
  });
});

describe('Utils :: isBuildersView', () => {
  test('Should return true', () => {
    const result = isBuildersView(ApplicationRoute.Adapters);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isBuildersView(ApplicationRoute.ApplicationRunners);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isBuildersView(ApplicationRoute.InterceptorTemplates);
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isBuildersView(ApplicationRoute.Models);
    expect(result).toBeFalsy();
  });
});

describe('Utils :: isAssetWithVersion', () => {
  test('Should return true for the versioned asset views', () => {
    expect(isAssetWithVersion(ApplicationRoute.AssetsApplications)).toBeTruthy();
    expect(isAssetWithVersion(ApplicationRoute.AssetsToolsets)).toBeTruthy();
  });

  // Prompts and conversations left the versioned group — they are versionless now.
  test('Should return false for prompts and conversations', () => {
    expect(isAssetWithVersion(ApplicationRoute.Prompts)).toBeFalsy();
    expect(isAssetWithVersion(ApplicationRoute.Conversations)).toBeFalsy();
  });

  test('Should return false', () => {
    const result = isAssetWithVersion(ApplicationRoute.Models);
    expect(result).toBeFalsy();
  });
});

describe('Utils :: isVersionlessAssetView', () => {
  test('Should return true for prompts and conversations', () => {
    expect(isVersionlessAssetView(ApplicationRoute.Prompts)).toBeTruthy();
    expect(isVersionlessAssetView(ApplicationRoute.Conversations)).toBeTruthy();
  });

  test('Should return false for the versioned asset views and non-asset views', () => {
    expect(isVersionlessAssetView(ApplicationRoute.AssetsApplications)).toBeFalsy();
    expect(isVersionlessAssetView(ApplicationRoute.AssetsToolsets)).toBeFalsy();
    expect(isVersionlessAssetView(ApplicationRoute.Models)).toBeFalsy();
  });
});

describe('Utils :: isViewWithDisplayVersion', () => {
  test('Should return true', () => {
    expect(isEntitiesWithDisplayVersion(ApplicationRoute.Models)).toBeTruthy();
    expect(isEntitiesWithDisplayVersion(ApplicationRoute.Applications)).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isEntitiesWithDisplayVersion(ApplicationRoute.Keys);
    expect(result).toBeFalsy();
  });
});

describe('Utils :: isToolsetRoute', () => {
  test.each([ApplicationRoute.Toolsets, ApplicationRoute.AssetsToolsets])('Should return true for %s', (route) => {
    expect(isToolsetRoute(route)).toBeTruthy();
  });

  test.each([ApplicationRoute.Models, ApplicationRoute.Applications, undefined])(
    'Should return false for %s',
    (route) => {
      expect(isToolsetRoute(route)).toBeFalsy();
    },
  );
});

describe('Utils :: isAssetView — catalog schemas', () => {
  test('Should treat the catalog-schema route as an asset view', () => {
    expect(isAssetView(ApplicationRoute.PlatformCatalogSchemas)).toBeTruthy();
  });
});

describe('Utils :: hasTopicCatalogue', () => {
  // Core has no topic registry, so these surfaces must not reach the admin backend for one.
  test.each([
    ApplicationRoute.PlatformModels,
    ApplicationRoute.PlatformAppRunners,
    ApplicationRoute.PlatformCatalogSchemas,
  ])('Should return false for %s', (route) => {
    expect(hasTopicCatalogue(route)).toBeFalsy();
  });

  // An opt-out list, so anything not listed keeps the catalogue — including surfaces that read their
  // own resource from Core, and an unset view.
  test.each([
    ApplicationRoute.Models,
    ApplicationRoute.ApplicationRunners,
    ApplicationRoute.AssetsApplications,
    ApplicationRoute.AssetsToolsets,
    undefined,
  ])('Should return true for %s', (route) => {
    expect(hasTopicCatalogue(route)).toBeTruthy();
  });
});
