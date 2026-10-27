import { describe, expect, test } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import { getFilePathGridOptions } from '@/src/components/Common/FilePath/utils';

describe('getFilePathGridOptions', () => {
  const t = (key: string) => key;
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets, ApplicationRoute.Prompts])(
    'uses the shared scalar column set for %s',
    (view) => {
      const options = getFilePathGridOptions(t, view);
      expect(options).toBeDefined();
      expect(options?.columnDefs?.some((column) => typeof column !== 'function' && column.colId === 'version')).toBe(
        view !== ApplicationRoute.Prompts,
      );
    },
  );
  test('keeps other surfaces on their default grid configuration', () => {
    expect(getFilePathGridOptions(t, ApplicationRoute.Models)).toBeUndefined();
    expect(getFilePathGridOptions(t)).toBeUndefined();
  });
});
