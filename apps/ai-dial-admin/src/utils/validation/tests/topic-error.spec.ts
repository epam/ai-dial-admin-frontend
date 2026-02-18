import { describe, expect, test } from 'vitest';

import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { getTopicError } from '@/src/utils/validation/topic-error';

describe('getErrorForDisplayName', () => {
  const t = (key: string) => key;

  test('returns error if name is too long', () => {
    expect(getTopicError('a'.repeat(300), t)).toEqual({
      type: ErrorType.LENGTH,
      text: ErrorI18nKey.MinMaxLength,
    });
  });

  test('returns null if name is ok', () => {
    expect(getTopicError('topic', t)).toBeNull();
  });
});
