import { describe, expect, test } from 'vitest';

import { CatalogSchemaDocument } from '@/src/models/dial/catalog-schema';
import { validateCatalogProperties } from '../validate-properties';

const schema = {
  $id: 'https://host/agent-card',
  required: ['tag'],
  properties: {
    tag: { type: 'string', enum: ['Featured', 'New'] },
    rank: { type: 'integer' },
    isBeta: { type: 'boolean' },
    topics: { type: 'array', items: { type: 'string' } },
    contact: { type: 'object', properties: { email: { type: 'string' } } },
    badge: { type: 'string', format: 'dial-file-encoded', 'dial:file': true },
    gallery: { type: 'array', format: 'dial-file-encoded', 'dial:file': true },
    summary: { 'dial:meta': { 'dial:localized': true } },
  },
} as unknown as CatalogSchemaDocument;

const valid = { tag: 'Featured', rank: 2, isBeta: true, topics: ['code'], contact: { email: 'a@b.c' } };

describe('validateCatalogProperties', () => {
  test('accepts values matching the schema', () => {
    expect(validateCatalogProperties(schema, valid)).toEqual([]);
  });

  test('reports a required property left out, naming it', () => {
    expect(validateCatalogProperties(schema, { rank: 1 })).toEqual([{ field: 'tag', message: '"tag" is required' }]);
  });

  test.each([
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['an empty array', []],
  ])('counts %s as a missing required value', (_label, value) => {
    expect(validateCatalogProperties(schema, { tag: value })).toEqual([{ field: 'tag', message: '"tag" is required' }]);
  });

  test.each([
    ['a string where an integer is declared', { rank: 'two' }, 'rank'],
    ['a string where a boolean is declared', { isBeta: 'yes' }, 'isBeta'],
    ['an object where an array is declared', { topics: { a: 1 } }, 'topics'],
    ['an array where an object is declared', { contact: [] }, 'contact'],
    ['a fractional value where an integer is declared', { rank: 1.5 }, 'rank'],
  ])('reports %s', (_label, values, field) => {
    const errors = validateCatalogProperties(schema, { tag: 'New', ...values });

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual(field);
  });

  test('reports a value outside the declared enumeration', () => {
    const errors = validateCatalogProperties(schema, { tag: 'Retired' });

    expect(errors).toEqual([{ field: 'tag', message: '"tag" must be one of Featured, New' }]);
  });

  test('accepts a DIAL file reference', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', badge: 'files/bucket7/logo.png' })).toEqual([]);
  });

  test('accepts every entry of a file-valued array', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', gallery: ['files/b1/a.png', 'files/b1/b.png'] })).toEqual(
      [],
    );
  });

  test.each([
    ['a plain path', 'logo.png'],
    ['a bucket-less reference', 'files//logo.png'],
    ['an absolute url', 'https://host/logo.png'],
  ])('reports %s as not a DIAL file reference', (_label, badge) => {
    const errors = validateCatalogProperties(schema, { tag: 'New', badge });

    expect(errors).toEqual([
      { field: 'badge', message: '"badge" must be a DIAL file reference such as files/{bucket}/{path}' },
    ]);
  });

  test('reports a file reference beyond the length Core accepts', () => {
    const badge = `files/bucket7/${'a'.repeat(4096)}`;

    expect(validateCatalogProperties(schema, { tag: 'New', badge })).toHaveLength(1);
  });

  test('reports one bad entry in a file-valued array', () => {
    const errors = validateCatalogProperties(schema, { tag: 'New', gallery: ['files/b1/a.png', 'b.png'] });

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toEqual('gallery');
  });

  test('accepts a locale map carrying the schema default locale', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', summary: { en: 'Hello' } })).toEqual([]);
  });

  test('reports a locale map missing the schema default locale', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', summary: { fr: 'Bonjour' } })).toEqual([
      { field: 'summary', message: '"summary" must carry the default locale "en"' },
    ]);
  });

  test('honours the schema own default locale over the fallback', () => {
    const localized = { ...schema, 'dial:defaultLocale': 'fr' } as CatalogSchemaDocument;

    expect(validateCatalogProperties(localized, { tag: 'New', summary: { fr: 'Bonjour' } })).toEqual([]);
    expect(validateCatalogProperties(localized, { tag: 'New', summary: { en: 'Hello' } })).toHaveLength(1);
  });

  test('accepts a plain string for a localized property', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', summary: 'Hello' })).toEqual([]);
  });

  test('reports an explicit null on an optional property, which Core also rejects', () => {
    const errors = validateCatalogProperties(schema, { tag: 'New', rank: null });

    expect(errors).toEqual([{ field: 'rank', message: '"rank" must be of type integer' }]);
  });

  test('reports a missing required property only once, not also as mistyped', () => {
    expect(validateCatalogProperties(schema, { tag: null })).toEqual([{ field: 'tag', message: '"tag" is required' }]);
  });

  test('ignores a value the schema declares no property for', () => {
    expect(validateCatalogProperties(schema, { tag: 'New', unknown: { anything: true } })).toEqual([]);
  });

  test('reports every failure at once rather than the first', () => {
    const errors = validateCatalogProperties(schema, { rank: 'two', badge: 'logo.png' });

    expect(errors.map((error) => error.field)).toEqual(['tag', 'rank', 'badge']);
  });

  test('is a no-op with no values at all, mirroring Core', () => {
    expect(validateCatalogProperties(schema, undefined)).toEqual([]);
  });

  test('is a no-op with no schema to validate against', () => {
    expect(validateCatalogProperties(undefined, valid)).toEqual([]);
  });

  test('reports a non-object value set rather than throwing', () => {
    expect(validateCatalogProperties(schema, 'not an object' as unknown as Record<string, unknown>)).toEqual([
      { field: 'catalogProperties', message: 'Catalog properties must be a JSON object' },
    ]);
  });

  test.each([
    ['a non-object schema', 'nope'],
    ['an array schema', []],
  ])('is a no-op for %s rather than throwing', (_label, malformed) => {
    expect(validateCatalogProperties(malformed as unknown as CatalogSchemaDocument, valid)).toEqual([]);
  });

  test('survives a properties map that is not an object', () => {
    const malformed = { ...schema, properties: 'nope' } as unknown as CatalogSchemaDocument;

    expect(validateCatalogProperties(malformed, valid)).toEqual([]);
  });

  test('survives a property definition that is not an object', () => {
    const malformed = { properties: { tag: true }, required: [] } as unknown as CatalogSchemaDocument;

    expect(validateCatalogProperties(malformed, { tag: 'New' })).toEqual([]);
  });

  test('ignores a required entry that is not a string', () => {
    const malformed = { ...schema, required: ['tag', 7] } as unknown as CatalogSchemaDocument;

    expect(validateCatalogProperties(malformed, { tag: 'New' })).toEqual([]);
  });
});
