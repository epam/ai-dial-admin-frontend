import { describe, expect, test } from 'vitest';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationSourceType } from '@/src/models/dial/application';
import { createSchemaSource, ENDPOINTS_SOURCE, getSchemaSourceId, SCHEMA_SOURCE } from '../application-source';

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

describe('ApplicationSourceType alias', () => {
  test('matches SOURCE_TYPE values', () => {
    expect(ApplicationSourceType.ENDPOINTS).toBe(SOURCE_TYPE.ENDPOINTS);
    expect(ApplicationSourceType.SCHEMA).toBe(SOURCE_TYPE.SCHEMA);
  });
});

describe('ENDPOINTS_SOURCE', () => {
  test('has ENDPOINTS $type and no applicationTypeSchemaId', () => {
    expect(ENDPOINTS_SOURCE.$type).toBe(SOURCE_TYPE.ENDPOINTS);
    expect(ENDPOINTS_SOURCE.applicationTypeSchemaId).toBeUndefined();
  });
});

describe('SCHEMA_SOURCE', () => {
  test('has SCHEMA $type and no applicationTypeSchemaId', () => {
    expect(SCHEMA_SOURCE.$type).toBe(SOURCE_TYPE.SCHEMA);
    expect(SCHEMA_SOURCE.applicationTypeSchemaId).toBeUndefined();
  });
});

describe('createSchemaSource', () => {
  test('creates schema source with applicationTypeSchemaId', () => {
    expect(createSchemaSource('urn:app:123')).toEqual({
      $type: SOURCE_TYPE.SCHEMA,
      applicationTypeSchemaId: 'urn:app:123',
    });
  });

  test('creates schema source with undefined id when called without args', () => {
    expect(createSchemaSource()).toEqual({
      $type: SOURCE_TYPE.SCHEMA,
      applicationTypeSchemaId: undefined,
    });
  });

  test('round-trips through getSchemaSourceId', () => {
    expect(getSchemaSourceId(createSchemaSource('urn:app:456'))).toBe('urn:app:456');
  });
});
