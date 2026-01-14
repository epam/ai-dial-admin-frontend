import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import { ParamsView } from '@/src/types/parameters';
import {
  getAppRunner,
  getFrameConfig,
  getInitialParamsView,
  generateViewItems,
  convertJsonSchema,
  getTypeFromUnion,
  convertAppPropertiesToArray,
} from '../utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialSchemePropertyType } from '@/src/models/dial/scheme';
import { ApplicationPropertiesTemp, DialApplicationScheme, TypeEntity } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';

describe('getFrameConfig', () => {
  test('returns config for DialApplicationScheme', () => {
    const scheme = {
      'dial:applicationTypeEditorUrl': 'https://editor.url',
      'dial:applicationTypeDisplayName': 'App Name',
    };
    const theme = 'dark';
    const session = { providerId: 'provider-123' };

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
    };
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
  test('returns scheme matching customAppSchemaId', () => {
    const entity = { customAppSchemaId: 'scheme-123' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching editorUrl when customAppSchemaId does not match', () => {
    const entity = { customAppSchemaId: 'nonexistent-id', editorUrl: 'https://url2' };
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

  test('returns scheme matching customAppSchemaId when applicationTypeSchemaId does not match', () => {
    const entity = { applicationTypeSchemaId: 'nonexistent-id', customAppSchemaId: 'scheme-456' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[1]);
  });

  test('returns scheme matching editorUrl when both applicationTypeSchemaId and customAppSchemaId do not match', () => {
    const entity = {
      applicationTypeSchemaId: 'nonexistent-id',
      customAppSchemaId: 'another-id',
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
    const entity = { customAppSchemaId: 'unknown-id', editorUrl: 'https://unknown.url' };
    const schemes = [{ $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' }];

    const result = getAppRunner(entity, schemes);
    expect(result).toBeUndefined();
  });

  test('returns entity cast as scheme when applicationSchemes is undefined', () => {
    const entity = {
      $id: 'scheme-789',
      'dial:applicationTypeEditorUrl': 'https://casted-url',
    };

    const result = getAppRunner(entity);
    expect(result).toEqual(entity);
  });

  test('returns scheme matching applicationTypeSchemaId if both applicationTypeSchemaId and customAppSchemaId exist', () => {
    const entity = { applicationTypeSchemaId: 'scheme-123', customAppSchemaId: 'scheme-456' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns scheme matching applicationTypeSchemaId when customAppSchemaId is invalid', () => {
    const entity = { applicationTypeSchemaId: 'scheme-123', customAppSchemaId: 'invalid-id' };
    const schemes = [
      { $id: 'scheme-123', 'dial:applicationTypeEditorUrl': 'https://url1' },
      { $id: 'scheme-456', 'dial:applicationTypeEditorUrl': 'https://url2' },
    ];

    const result = getAppRunner(entity, schemes);
    expect(result).toEqual(schemes[0]);
  });

  test('returns undefined when no schemes match and applicationSchemes is non-empty', () => {
    const entity = { customAppSchemaId: 'unknown-id' };
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

    const schemeData: Record<string, DefaultsValue> = {
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

    const schemeData: Record<string, DefaultsValue> = {
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

    const schemeData: Record<string, DefaultsValue> = {
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

    const schemeData: Record<string, DefaultsValue> = {
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

    const schemeData: Record<string, DefaultsValue> = {};

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

    const schemeData: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {};

    const result = convertAppPropertiesToArray(properties);

    expect(result).toEqual([]);
  });

  test('should work when no schemeProperties are provided', () => {
    const properties: Record<string, DefaultsValue> = {
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
    const properties: Record<string, DefaultsValue> = {
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
