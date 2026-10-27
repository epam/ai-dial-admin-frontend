import { describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { validationFailure } from '@/src/utils/validation/server-action';

describe('validationFailure', () => {
  test.each([
    [{ version: 'Version is required' }, 'Version is required'],
    [{ version: 'Version is required', name: 'Name is required' }, 'Version is required, Name is required'],
    [{ version: 'Version is required', name: undefined, folder: '' }, 'Version is required'],
    [{}, ''],
  ])('returns a localized validation response for %j', (errors, errorMessage) => {
    const t = vi.fn(() => 'Localized validation error');

    expect(validationFailure(errors, t)).toEqual({
      success: false,
      errorHeader: 'Localized validation error',
      errorMessage,
    });
    expect(t).toHaveBeenCalledWith(ErrorI18nKey.ValidationError);
  });
});
