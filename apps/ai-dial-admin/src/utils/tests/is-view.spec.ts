import {
  isAssetView,
  isAssetWithVersion,
  isBuildersView,
  isEntitiesWithDisplayVersion,
  isEvaluationView,
  isToolsetRoute,
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
  test('Should return true', () => {
    expect(isAssetWithVersion(ApplicationRoute.Prompts)).toBeTruthy();
    expect(isAssetWithVersion(ApplicationRoute.AssetsApplications)).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isAssetWithVersion(ApplicationRoute.Models);
    expect(result).toBeFalsy();
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
