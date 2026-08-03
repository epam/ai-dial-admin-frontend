import { describe, expect, test } from 'vitest';
import { getDefaultContentForType } from '../body-content';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';

describe('getDefaultContentForType', () => {
  test('returns an empty object for application/json', () => {
    expect(getDefaultContentForType(ContentType.JSON)).toEqual({});
  });

  test('returns an empty array for multipart/form-data', () => {
    expect(getDefaultContentForType(ContentType.FormData)).toEqual([]);
  });

  test('returns an empty object when contentType is undefined', () => {
    expect(getDefaultContentForType(undefined)).toEqual({});
  });

  test('returns an empty object for an unknown content type', () => {
    expect(getDefaultContentForType('text/plain')).toEqual({});
  });
});
