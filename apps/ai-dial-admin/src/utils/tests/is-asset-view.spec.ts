import { isAssetView } from '../is-asset-view';
import { describe, expect, test } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';

describe('Utils :: isAssetView', () => {
  test('Should return true', () => {
    const result = isAssetView(ApplicationRoute.Files);
    expect(result).toBeTruthy();
  });

  test('Should return false', () => {
    const result = isAssetView(ApplicationRoute.Models);
    expect(result).toBeFalsy();
  });
});
