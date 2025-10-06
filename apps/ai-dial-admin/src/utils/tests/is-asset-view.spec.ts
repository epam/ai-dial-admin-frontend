import { isAssetView, isNotDuplicateAssetView } from '../is-asset-view';
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

describe('Utils :: isNotDuplicateAssetView', () => {
  test('Should return true', () => {
    const result = isNotDuplicateAssetView(ApplicationRoute.Files);
    expect(result).toBeTruthy();
  });

  test('Should return true', () => {
    const result = isNotDuplicateAssetView(ApplicationRoute.AssetsApplications);
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isNotDuplicateAssetView(ApplicationRoute.Prompts);
    expect(result).toBeFalsy();
  });

  test('Should return true', () => {
    const result = isNotDuplicateAssetView(ApplicationRoute.AssetsToolsets);
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isAssetView(ApplicationRoute.Models);
    expect(result).toBeFalsy();
  });
});
