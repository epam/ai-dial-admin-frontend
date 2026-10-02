import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { getImportSizeLimits } from '@/src/utils/import/get-import-size-limits';

describe('getImportSizeLimits', () => {
  test('returns the raised limits for the Files route', () => {
    expect(getImportSizeLimits(ApplicationRoute.Files)).toEqual({ maxFileSizeMb: 100, maxMultiFilesSizeMb: 100 });
  });

  test.each([ApplicationRoute.Applications, ApplicationRoute.Toolsets, ApplicationRoute.Prompts, undefined])(
    'returns the default limits for %s',
    (route) => {
      expect(getImportSizeLimits(route)).toEqual({ maxFileSizeMb: 4, maxMultiFilesSizeMb: 64 });
    },
  );
});
