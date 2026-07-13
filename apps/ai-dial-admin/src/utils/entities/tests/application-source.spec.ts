import { describe, expect, test } from 'vitest';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationSourceType } from '@/src/models/dial/application';
import {
  createCodeAppFields,
  createSchemaSource,
  ENDPOINTS_SOURCE,
  getSchemaSourceId,
  isCodeAppSource,
  SCHEMA_SOURCE,
} from '../application-source';

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

describe('isCodeAppSource', () => {
  const url = 'https://code-app.example.com';

  test('returns true when endpoints source endpoint and editorUrl match the configured url', () => {
    expect(isCodeAppSource({ source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: url, editor_url: url }, url)).toBe(
      true,
    );
  });

  test('returns false when no configured url is provided', () => {
    expect(
      isCodeAppSource({ source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: url, editor_url: url }, undefined),
    ).toBe(false);
  });

  test('returns false when source type is not endpoints', () => {
    expect(isCodeAppSource({ source: { $type: SOURCE_TYPE.SCHEMA }, endpoint: url, editor_url: url }, url)).toBe(false);
  });

  test('returns false when endpoint does not match', () => {
    expect(isCodeAppSource({ source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: 'other', editor_url: url }, url)).toBe(
      false,
    );
  });

  test('returns false when editorUrl does not match', () => {
    expect(isCodeAppSource({ source: { $type: SOURCE_TYPE.ENDPOINTS }, endpoint: url, editor_url: 'other' }, url)).toBe(
      false,
    );
  });

  test('returns false for undefined entity', () => {
    expect(isCodeAppSource(undefined, url)).toBe(false);
  });
});

describe('createCodeAppFields', () => {
  test('builds endpoints source with endpoint and editorUrl set to the configured url', () => {
    const url = 'https://code-app.example.com';
    expect(createCodeAppFields(url)).toEqual({
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: url,
      editor_url: url,
    });
  });
});
