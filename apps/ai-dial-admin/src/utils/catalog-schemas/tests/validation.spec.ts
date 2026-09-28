import { describe, expect, test } from 'vitest';

import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { isValidCatalogSchema, validateCatalogSchema } from '../validation';

const schema = (overrides: Partial<DialCatalogSchemaResource> = {}): DialCatalogSchemaResource =>
  ({
    $id: 'https://dial.epam.com/catalog_schemas/agent',
    'dial:catalogEntityType': CatalogEntityType.Agent,
    'dial:catalogDisplayName': 'Agent',
    ...overrides,
  }) as DialCatalogSchemaResource;

const fieldsOf = (errors: { field: string }[]) => errors.map((error) => error.field);

describe('Catalog Schema Utils :: validateCatalogSchema', () => {
  test('Should accept a schema carrying only the required fields', () => {
    expect(validateCatalogSchema(schema())).toEqual([]);
    expect(isValidCatalogSchema(schema())).toBe(true);
  });

  test('Should report a missing id', () => {
    expect(fieldsOf(validateCatalogSchema(schema({ $id: undefined })))).toEqual(['$id']);
  });

  test.each(['   ', '\t'])('Should report a whitespace-only id (%j) as missing', (id) => {
    expect(validateCatalogSchema(schema({ $id: id }))).toEqual([{ field: '$id', message: 'Id is required' }]);
  });

  test('Should report an id that is not a string', () => {
    const errors = validateCatalogSchema(schema({ $id: 42 as unknown as string }));

    expect(errors).toEqual([{ field: '$id', message: 'Id must be a string' }]);
  });

  test.each(['!', '~', '*', "'", '(', ')'])('Should report an id containing %s', (char) => {
    const errors = validateCatalogSchema(schema({ $id: `https://host/schema${char}` }));

    expect(errors[0].field).toEqual('$id');
    expect(errors[0].message).toContain('must not contain');
  });

  test('Should report a missing entity type', () => {
    const errors = validateCatalogSchema(schema({ 'dial:catalogEntityType': undefined }));

    expect(errors).toEqual([{ field: 'dial:catalogEntityType', message: 'Entity type is required' }]);
  });

  test('Should report an entity type outside the supported set', () => {
    const errors = validateCatalogSchema(
      schema({ 'dial:catalogEntityType': 'application' as unknown as CatalogEntityType }),
    );

    expect(errors[0].field).toEqual('dial:catalogEntityType');
    expect(errors[0].message).toContain('model, agent, toolset, skill, interceptor');
  });

  test.each([
    CatalogEntityType.Model,
    CatalogEntityType.Agent,
    CatalogEntityType.Toolset,
    CatalogEntityType.Skill,
    CatalogEntityType.Interceptor,
  ])('Should accept the %s entity type', (entityType) => {
    expect(validateCatalogSchema(schema({ 'dial:catalogEntityType': entityType }))).toEqual([]);
  });

  test.each([undefined, '', '   '])('Should report a blank display name (%s)', (displayName) => {
    const errors = validateCatalogSchema(schema({ 'dial:catalogDisplayName': displayName }));

    expect(errors).toEqual([{ field: 'dial:catalogDisplayName', message: 'Display name is required' }]);
  });

  test('Should report a display name that is not a string', () => {
    const errors = validateCatalogSchema(schema({ 'dial:catalogDisplayName': { en: 'Agent' } as unknown as string }));

    expect(fieldsOf(errors)).toEqual(['dial:catalogDisplayName']);
  });

  test.each(['en', 'en-US', 'pt-BR'])('Should accept the default locale %s', (locale) => {
    expect(validateCatalogSchema(schema({ 'dial:defaultLocale': locale }))).toEqual([]);
  });

  test.each(['EN', 'en_US', 'en-us', 'english', 'e'])('Should report the malformed default locale %s', (locale) => {
    const errors = validateCatalogSchema(schema({ 'dial:defaultLocale': locale }));

    expect(errors[0].field).toEqual('dial:defaultLocale');
    expect(errors[0].message).toContain('BCP-47');
  });

  test.each([undefined, ''])('Should treat an absent default locale (%s) as valid', (locale) => {
    expect(validateCatalogSchema(schema({ 'dial:defaultLocale': locale }))).toEqual([]);
  });

  test('Should report a default locale that is not a string', () => {
    const errors = validateCatalogSchema(schema({ 'dial:defaultLocale': 7 as unknown as string }));

    expect(fieldsOf(errors)).toEqual(['dial:defaultLocale']);
  });

  test('Should accept a file property declaring the required type and format', () => {
    const properties = {
      badge: { type: 'string', format: 'dial-file-encoded', 'dial:file': true },
    } as DialCatalogSchemaResource['properties'];

    expect(validateCatalogSchema(schema({ properties }))).toEqual([]);
  });

  test.each([
    ['no format', { type: 'string', 'dial:file': true }],
    ['the wrong format', { type: 'string', format: 'uri', 'dial:file': true }],
    ['the wrong type', { type: 'object', format: 'dial-file-encoded', 'dial:file': true }],
  ])('Should report a file property with %s', (_label, definition) => {
    const properties = { badge: definition } as DialCatalogSchemaResource['properties'];
    const errors = validateCatalogSchema(schema({ properties }));

    expect(errors[0].field).toEqual('properties.badge');
    expect(errors[0].message).toContain('dial-file-encoded');
  });

  test('Should leave a property that never declared dial:file alone', () => {
    const properties = { summary: { type: 'string' } } as DialCatalogSchemaResource['properties'];

    expect(validateCatalogSchema(schema({ properties }))).toEqual([]);
  });

  test('Should report properties that are not an object', () => {
    const properties = [{ type: 'string' }] as unknown as DialCatalogSchemaResource['properties'];
    const errors = validateCatalogSchema(schema({ properties }));

    expect(fieldsOf(errors)).toEqual(['properties']);
  });

  test.each([null, undefined, 'a string', 42, []])('Should report %s as not being a schema object', (value) => {
    const errors = validateCatalogSchema(value as unknown as DialCatalogSchemaResource);

    expect(errors).toEqual([{ field: '$id', message: 'A catalog schema must be a JSON object' }]);
  });

  test('Should report every violation at once rather than stopping at the first', () => {
    const errors = validateCatalogSchema({
      'dial:defaultLocale': 'EN',
      properties: { badge: { type: 'string', 'dial:file': true } },
    } as unknown as DialCatalogSchemaResource);

    expect(fieldsOf(errors)).toEqual([
      '$id',
      'dial:catalogEntityType',
      'dial:catalogDisplayName',
      'dial:defaultLocale',
      'properties.badge',
    ]);
  });
});
