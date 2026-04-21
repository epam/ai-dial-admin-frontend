import { describe, expect, test } from 'vitest';

import { ApplicationSourceType } from '@/src/models/dial/application';
import { getSchemaSourceId } from '../application-source';

describe('getSchemaSourceId', () => {
  test('returns undefined for undefined input', () => {
    expect(getSchemaSourceId(undefined)).toBeUndefined();
  });

  test('returns undefined for endpoints source', () => {
    expect(getSchemaSourceId({ $type: ApplicationSourceType.ENDPOINTS })).toBeUndefined();
  });

  test('returns undefined for schema source without id', () => {
    expect(getSchemaSourceId({ $type: ApplicationSourceType.SCHEMA })).toBeUndefined();
  });

  test('returns applicationTypeSchemaId for schema source', () => {
    expect(getSchemaSourceId({ $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'urn:x' })).toBe('urn:x');
  });
});
