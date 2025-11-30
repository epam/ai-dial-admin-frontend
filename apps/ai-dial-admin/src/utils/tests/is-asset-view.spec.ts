import { isAssetView, isAssetWithVersion, isBuildersView } from '../is-asset-view';
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
