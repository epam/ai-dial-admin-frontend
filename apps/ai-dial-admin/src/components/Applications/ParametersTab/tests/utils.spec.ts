import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import { ParamsView } from '@/src/types/parameters';
import {
  getAppRunner,
  getCorrectConfig,
  getFrameConfig,
  getInitialParamsView,
  getTargetUrl,
  generateViewItems,
  convertJsonSchema,
  getTypeFromUnion,
  convertAppPropertiesToArray,
  validateAppProperties,
} from '../utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialSchemePropertyType } from '@/src/models/dial/scheme';
import {
  ApplicationPropertiesTemp,
  ApplicationSourceType,
  DialApplication,
  DialApplicationScheme,
  TypeEntity,
} from '@/src/models/dial/application';
import { UserSession } from '@/src/models/auth';

describe('getFrameConfig', () => {
  test('returns config for DialApplicationScheme', () => {
    const scheme = {
      'dial:applicationTypeEditorUrl': 'https://editor.url',
      'dial:applicationTypeDisplayName': 'App Name',
    };
    const theme = 'dark';
    const session = { providerId: 'provider-123' } as unknown as UserSession;

    const config = getFrameConfig(scheme, theme, session);

    expect(config).toEqual({
      theme: 'dark',
      providerId: 'provider-123',
      host: 'https://editor.url',
      name: 'App Name',
    });
  });

  test('returns config for DialApplicationResource', () => {
    const resource = {
      editorUrl: 'https://resource-editor.url',
      name: 'Resource Name',
    } as unknown as DialApplicationScheme;
    const theme = 'light';

    const config = getFrameConfig(resource, theme);

    expect(config).toEqual({
      theme: 'light',
      providerId: undefined,
      host: 'https://resource-editor.url',
      name: 'Resource Name',
    });
  });

  test('returns undefined for missing host and name', () => {
    const scheme = {};
    const theme = 'dark';

    const config = getFrameConfig(scheme, theme);

    expect(config).toEqual({
      theme: 'dark',
      providerId: undefined,
      host: undefined,
      name: undefined,
    });
  });
});

describe('getAppRunner', () => {
  test('returns scheme matching source applicationTypeSchemaId', () => {
    const entity = { source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'scheme-123' } };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching editorUrl when source applicationTypeSchemaId does not match', () => {
    const entity = {
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'nonexistent-id' },
      editorUrl: 'https://url2',
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching applicationTypeSchemaId from DialAssetApp', () => {
    const entity = { applicationTypeSchemaId: 'scheme-789' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-789', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching source when AssetApp applicationTypeSchemaId does not match', () => {
    const entity = {
      applicationTypeSchemaId: 'nonexistent-id',
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'scheme-456' },
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching editorUrl when both AssetApp applicationTypeSchemaId and source do not match', () => {
    const entity = {
      applicationTypeSchemaId: 'nonexistent-id',
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'another-id' },
      editorUrl: 'https://url2',
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns undefined when no matching scheme is found', () => {
    const entity = {
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'unknown-id' },
      editorUrl: 'https://unknown.url',
    };
    const schemes = [{ $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' }];

    const result = getAppRunner(entity, schemes);
    expect(result).toBeUndefined();
  });

  test('returns entity cast as scheme when applicationSchemes is undefined', () => {
    const entity = {
      $id: 'scheme-789',
      'dial:applicationTypeEditorUrl': 'https://casted-url',
    } as unknown as DialApplication;

    const result = getAppRunner(entity);
    expect(result).toEqual(entity);
  });

  test('returns scheme matching AssetApp applicationTypeSchemaId when both AssetApp id and source exist', () => {
    const entity = {
      applicationTypeSchemaId: 'scheme-123',
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'scheme-456' },
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching AssetApp applicationTypeSchemaId when source is invalid', () => {
    const entity = {
      applicationTypeSchemaId: 'scheme-123',
      source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'invalid-id' },
    };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns undefined when no schemes match and applicationSchemes is non-empty', () => {
    const entity = { source: { $type: ApplicationSourceType.SCHEMA, applicationTypeSchemaId: 'unknown-id' } };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toBeUndefined();
  });
});

describe('getInitialParamsView', () => {
  test('should return ParamsView.FORM for ApplicationPublications route', () => {
    const result = getInitialParamsView(ApplicationRoute.ApplicationPublications);
    expect(result).toBe(ParamsView.FORM);
  });

  test('should return ParamsView.FORM for ApplicationRunners route', () => {
    const result = getInitialParamsView(ApplicationRoute.ApplicationRunners);
    expect(result).toBe(ParamsView.FORM);
  });

  test('should return ParamsView.UI when uiExist is true', () => {
    const result = getInitialParamsView(undefined, true);
    expect(result).toBe(ParamsView.UI);
  });

  test('should return ParamsView.TABLE when uiExist is false and route is neither ApplicationPublications nor ApplicationRunners', () => {
    const result = getInitialParamsView(undefined, false);
    expect(result).toBe(ParamsView.TABLE);
  });
});

describe('generateViewItems', () => {
  const t = vi.fn((key) => key);

  test('should return an empty array for ApplicationPublications route', () => {
    const result = generateViewItems(t, ApplicationRoute.ApplicationPublications);
    expect(result).toEqual([]);
  });

  test('should return an empty array for ApplicationRunners route', () => {
    const result = generateViewItems(t, ApplicationRoute.ApplicationRunners);
    expect(result).toEqual([]);
  });

  test('should include ParamsView.FORM when showForm is true', () => {
    const result = generateViewItems(t, undefined, false, true);
    expect(result).toContainEqual({
      value: ParamsView.FORM,
      label: t(EntitiesI18nKey[ParamsView.FORM]),
    });
  });

  test('should include ParamsView.UI when showUi is true', () => {
    const result = generateViewItems(t, undefined, true, false);
    expect(result).toContainEqual({
      value: ParamsView.UI,
      label: t(EntitiesI18nKey[ParamsView.UI]),
    });
  });

  test('should include both ParamsView.FORM and ParamsView.UI when both showForm and showUi are true', () => {
    const result = generateViewItems(t, undefined, true, true);

    expect(result).toContainEqual({
      value: ParamsView.FORM,
      label: t(EntitiesI18nKey[ParamsView.FORM]),
    });
    expect(result).toContainEqual({
      value: ParamsView.UI,
      label: t(EntitiesI18nKey[ParamsView.UI]),
    });
  });

  test('should return only ParamsView.TABLE when neither showForm nor showUi are true', () => {
    const result = generateViewItems(t, undefined, false, false);
    expect(result).toEqual([
      {
        value: ParamsView.TABLE,
        label: t(EntitiesI18nKey[ParamsView.TABLE]),
      },
    ]);
  });

  test('should call the translation function with correct keys', () => {
    generateViewItems(t, undefined, true, true);

    expect(t).toHaveBeenCalledWith(EntitiesI18nKey[ParamsView.TABLE]);
    expect(t).toHaveBeenCalledWith(EntitiesI18nKey[ParamsView.FORM]);
    expect(t).toHaveBeenCalledWith(EntitiesI18nKey[ParamsView.UI]);
  });
});

describe('convertJsonSchema', () => {
  test('should handle basic schema with required fields', () => {
    const schema: DialApplicationScheme = {
      properties: {
        field1: { type: TypeEntity.STRING },
        field2: { type: TypeEntity.STRING },
      },
      required: ['field1'],
    };

    const schemeData: Record<string, unknown> = {
      field1: 'value1',
      field2: 'value2',
    };

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([
      {
        key: 'field1',
        value: 'value1',
        type: TypeEntity.STRING,
        required: true,
        isFromScheme: true,
      },
      {
        key: 'field2',
        value: 'value2',
        type: TypeEntity.STRING,
        required: false,
        isFromScheme: true,
      },
    ]);
  });

  test('should handle schema with `anyOf` (union types)', () => {
    const schema: DialApplicationScheme = {
      properties: {
        field1: { anyOf: [{ type: TypeEntity.STRING }, { type: TypeEntity.NUMBER }] },
      },
      required: [],
    };

    const schemeData: Record<string, unknown> = {
      field1: 'value1',
    };

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([
      {
        key: 'field1',
        value: 'value1',
        type: TypeEntity.OBJECT,
        required: false,
        isFromScheme: true,
      },
    ]);
  });

  test('should handle schema with `oneOf` (union types)', () => {
    const schema: DialApplicationScheme = {
      properties: {
        field1: { oneOf: [{ type: TypeEntity.STRING }, { type: TypeEntity.BOOLEAN }] },
      },
      required: [],
    };

    const schemeData: Record<string, unknown> = {
      field1: true,
    };

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([
      {
        key: 'field1',
        value: true,
        type: TypeEntity.OBJECT,
        required: false,
        isFromScheme: true,
      },
    ]);
  });

  test('should handle array type schema correctly', () => {
    const schema: DialApplicationScheme = {
      properties: {
        field1: { type: TypeEntity.ARRAY },
      },
      required: [],
    };

    const schemeData: Record<string, unknown> = {
      field1: ['value1', 'value2'],
    };

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([
      {
        key: 'field1',
        value: ['value1', 'value2'],
        type: TypeEntity.OBJECT,
        required: false,
        isFromScheme: true,
      },
    ]);
  });

  test('should handle empty schema correctly', () => {
    const schema: DialApplicationScheme = {
      properties: {},
      required: [],
    };

    const schemeData: Record<string, unknown> = {};

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([]);
  });

  test('should handle schema with no required properties', () => {
    const schema: DialApplicationScheme = {
      properties: {
        field1: { type: TypeEntity.STRING },
        field2: { type: TypeEntity.NUMBER },
      },
      required: [],
    };

    const schemeData: Record<string, unknown> = {
      field1: 'value1',
      field2: 123,
    };

    const result: ApplicationPropertiesTemp[] = convertJsonSchema(schema, schemeData);

    expect(result).toEqual([
      {
        key: 'field1',
        value: 'value1',
        type: TypeEntity.STRING,
        required: false,
        isFromScheme: true,
      },
      {
        key: 'field2',
        value: 123,
        type: TypeEntity.NUMBER,
        required: false,
        isFromScheme: true,
      },
    ]);
  });
});

describe('getTypeFromUnion', () => {
  test('should return STRING for a STRING type', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.STRING }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.STRING);
  });

  test('should return NUMBER for a NUMBER type', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.NUMBER }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.NUMBER);
  });

  test('should return BOOLEAN for a BOOLEAN type', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.BOOLEAN }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.BOOLEAN);
  });

  test('should return OBJECT for an ARRAY type', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.ARRAY }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return NULL type handling (remove NULL from types)', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.NULL }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return OBJECT for a $ref type', () => {
    const types: DialSchemePropertyType[] = [{ $ref: 'SomeRef' }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return the correct type for multiple types', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.STRING }, { type: TypeEntity.NUMBER }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return the correct type when combining types with $ref', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.STRING }, { $ref: 'SomeRef' }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return OBJECT for a combination of NULL and other types', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.STRING }, { type: TypeEntity.NULL }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.STRING);
  });

  test('should handle an empty array and return OBJECT', () => {
    const types: DialSchemePropertyType[] = [];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return OBJECT if only NULL is present', () => {
    const types: DialSchemePropertyType[] = [{ type: TypeEntity.NULL }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });

  test('should return OBJECT if both $ref and NULL are present', () => {
    const types: DialSchemePropertyType[] = [{ $ref: 'SomeRef' }, { type: TypeEntity.NULL }];
    const result = getTypeFromUnion(types);
    expect(result).toBe(TypeEntity.OBJECT);
  });
});

describe('convertAppPropertiesToArray', () => {
  test('should convert properties to array correctly', () => {
    const properties: Record<string, unknown> = {
      field1: 'value1',
      field2: 123,
    };

    const result = convertAppPropertiesToArray(properties);

    expect(result).toEqual([
      {
        key: 'field1',
        type: 'string',
        value: 'value1',
        required: false,
        isFromScheme: false,
      },
      {
        key: 'field2',
        type: 'number',
        value: 123,
        required: false,
        isFromScheme: false,
      },
    ]);
  });

  test('should update existing properties if they already exist in schemeProperties', () => {
    const properties: Record<string, unknown> = {
      field1: 'new value',
    };

    const schemeProperties: ApplicationPropertiesTemp[] = [
      {
        key: 'field1',
        type: 'string',
        value: 'old value',
        required: false,
        isFromScheme: true,
      },
    ];

    const result = convertAppPropertiesToArray(properties, schemeProperties);

    expect(result).toEqual([
      {
        key: 'field1',
        type: 'string',
        value: 'new value',
        required: false,
        isFromScheme: true,
      },
    ]);
  });

  test('should add new properties if they do not exist in schemeProperties', () => {
    const properties: Record<string, unknown> = {
      field1: 'value1',
    };

    const schemeProperties: ApplicationPropertiesTemp[] = [];

    const result = convertAppPropertiesToArray(properties, schemeProperties);

    expect(result).toEqual([
      {
        key: 'field1',
        type: 'string',
        value: 'value1',
        required: false,
        isFromScheme: false,
      },
    ]);
  });

  test('should sort the result based on isFromScheme property', () => {
    const properties: Record<string, unknown> = {
      field1: 'value1',
      field2: 123,
    };

    const schemeProperties: ApplicationPropertiesTemp[] = [
      {
        key: 'field3',
        type: 'string',
        value: 'scheme value',
        required: false,
        isFromScheme: true,
      },
    ];

    const result = convertAppPropertiesToArray(properties, schemeProperties);

    expect(result).toEqual([
      {
        key: 'field3',
        type: 'string',
        value: 'scheme value',
        required: false,
        isFromScheme: true,
      },
      {
        key: 'field1',
        type: 'string',
        value: 'value1',
        required: false,
        isFromScheme: false,
      },
      {
        key: 'field2',
        type: 'number',
        value: 123,
        required: false,
        isFromScheme: false,
      },
    ]);
  });

  test('should handle empty properties object and return empty array', () => {
    const properties: Record<string, unknown> = {};

    const result = convertAppPropertiesToArray(properties);

    expect(result).toEqual([]);
  });

  test('should work when no schemeProperties are provided', () => {
    const properties: Record<string, unknown> = {
      field1: 'value1',
      field2: 123,
    };

    const result = convertAppPropertiesToArray(properties);

    expect(result).toEqual([
      {
        key: 'field1',
        type: 'string',
        value: 'value1',
        required: false,
        isFromScheme: false,
      },
      {
        key: 'field2',
        type: 'number',
        value: 123,
        required: false,
        isFromScheme: false,
      },
    ]);
  });

  test('should handle multiple properties with the same key', () => {
    const properties: Record<string, unknown> = {
      field1: 'value1',
      field2: 123,
    };

    const schemeProperties: ApplicationPropertiesTemp[] = [
      {
        key: 'field1',
        type: 'string',
        value: 'old value',
        required: false,
        isFromScheme: true,
      },
    ];

    const result = convertAppPropertiesToArray(properties, schemeProperties);

    expect(result).toEqual([
      {
        key: 'field1',
        type: 'string',
        value: 'value1',
        required: false,
        isFromScheme: true,
      },
      {
        key: 'field2',
        type: 'number',
        value: 123,
        required: false,
        isFromScheme: false,
      },
    ]);
  });
});

describe('getCorrectConfig', () => {
  const session = { providerId: 'keycloak' } as any;

  test('should return config from scheme when scheme is provided', () => {
    const scheme = {
      'dial:applicationTypeEditorUrl': 'https://editor.com',
      'dial:applicationTypeDisplayName': 'App',
    };
    const result = getCorrectConfig(scheme as any, undefined, 'dark', session);

    expect(result).toEqual({
      theme: 'dark',
      providerId: 'keycloak',
      host: 'https://editor.com',
      name: 'App',
    });
  });

  test('should return config from application editorUrl when no scheme', () => {
    const application = {
      editorUrl: 'https://app-editor.com',
      name: 'App Name',
    };
    const result = getCorrectConfig(undefined, application as any, 'light', session);

    expect(result).toEqual({
      theme: 'light',
      providerId: 'keycloak',
      host: 'https://app-editor.com',
      name: 'App Name',
    });
  });

  test('should return null when no scheme and no editorUrl', () => {
    const application = { name: 'App' };
    const result = getCorrectConfig(undefined, application as any, 'dark', session);

    expect(result).toBeNull();
  });

  test('should return null when both scheme and application are undefined', () => {
    const result = getCorrectConfig(undefined, undefined, 'dark', session);

    expect(result).toBeNull();
  });

  test('should prefer scheme over application editorUrl', () => {
    const scheme = {
      'dial:applicationTypeEditorUrl': 'https://scheme-editor.com',
      'dial:applicationTypeDisplayName': 'Scheme App',
    };
    const application = {
      editorUrl: 'https://app-editor.com',
      name: 'App Name',
    };
    const result = getCorrectConfig(scheme as any, application as any, 'dark', session);

    expect(result?.host).toBe('https://scheme-editor.com');
  });
});

describe('getTargetUrl', () => {
  const frameConfig = {
    host: 'https://editor.example.com',
    providerId: 'keycloak',
    theme: 'dark',
  };

  test('should return URL for AssetsApplications route', () => {
    const application = { path: 'my-app/v1', name: 'my-app' } as any;
    const result = getTargetUrl(ApplicationRoute.AssetsApplications, application, frameConfig);

    expect(result).toBeInstanceOf(URL);
    expect(result?.searchParams.get('id')).toBe('applications/my-app/v1');
    expect(result?.searchParams.get('authProvider')).toBe('keycloak');
    expect(result?.searchParams.get('theme')).toBe('dark');
  });

  test('should return URL with application name for non-asset routes', () => {
    const application = { name: 'my-app' } as any;
    const result = getTargetUrl(ApplicationRoute.Applications, application, frameConfig);

    expect(result).toBeInstanceOf(URL);
    expect(result?.searchParams.get('id')).toBe('my-app');
  });

  test('should return null for invalid host URL', () => {
    const application = { name: 'app' } as any;
    const result = getTargetUrl(ApplicationRoute.Applications, application, {
      host: 'not-a-url',
      providerId: 'keycloak',
      theme: 'dark',
    });

    expect(result).toBeNull();
  });

  test('should return null when frameConfig is undefined', () => {
    const application = { name: 'app' } as any;
    const result = getTargetUrl(ApplicationRoute.Applications, application, undefined);

    expect(result).toBeNull();
  });
});

describe('validateAppProperties', () => {
  test('should return true when all required properties have values', () => {
    const properties: ApplicationPropertiesTemp[] = [
      { key: 'name', value: 'test', type: 'string', required: true },
      { key: 'opt', value: '', type: 'string', required: false },
    ];
    expect(validateAppProperties(properties)).toBe(true);
  });

  test('should return false when a required property has no value', () => {
    const properties: ApplicationPropertiesTemp[] = [{ key: 'name', value: '' as any, type: 'string', required: true }];
    expect(validateAppProperties(properties)).toBe(false);
  });

  test('should return false when a required property has undefined value', () => {
    const properties: ApplicationPropertiesTemp[] = [
      { key: 'name', value: undefined as any, type: 'string', required: true },
    ];
    expect(validateAppProperties(properties)).toBe(false);
  });

  test('should return true for empty properties array', () => {
    expect(validateAppProperties([])).toBe(true);
  });

  test('should return true when no properties are required', () => {
    const properties: ApplicationPropertiesTemp[] = [
      { key: 'a', value: '' as any, type: 'string', required: false },
      { key: 'b', value: undefined as any, type: 'string', required: false },
    ];
    expect(validateAppProperties(properties)).toBe(true);
  });
});
