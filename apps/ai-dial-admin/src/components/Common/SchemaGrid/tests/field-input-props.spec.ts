import { describe, expect, test } from 'vitest';

import { CATALOG_META_SECTION, CATALOG_META_TAB } from '@/src/constants/catalog-schemas';
import { CATALOG_SCHEMA_META_COLUMNS, DEFAULT_SCHEMA_FIELD_INPUT_PROPS } from '../constants';
import { SchemaConstraintRule, SchemaInputField, SchemaMetaColumn } from '../models';
import { getFieldConstraintViolations, resolveSchemaFieldInputProps, SchemaFieldRow } from '../utils';

const row = (overrides: Partial<SchemaFieldRow> = {}): SchemaFieldRow => ({
  id: 'f1',
  name: 'summary',
  type: 'string',
  required: false,
  title: '',
  description: '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
  ...overrides,
});

const long = (length: number) => 'x'.repeat(length);

describe('SchemaGrid :: resolveSchemaFieldInputProps', () => {
  test('Should apply the defaults when no config is given', () => {
    expect(resolveSchemaFieldInputProps()).toEqual(DEFAULT_SCHEMA_FIELD_INPUT_PROPS);
  });

  test('Should drop every default when the config is switched off', () => {
    expect(resolveSchemaFieldInputProps(false)).toEqual({});
  });

  test('Should drop one field for null and keep the others', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Description]: null });

    expect(resolved[SchemaInputField.Description]).toBeUndefined();
    expect(resolved[SchemaInputField.Title]).toEqual({ maxLength: 255 });
  });

  test('Should override one attribute and keep the rest of the field', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Title]: { maxLength: 100, spellCheck: false } });

    expect(resolved[SchemaInputField.Title]).toEqual({ maxLength: 100, spellCheck: false });
    expect(resolved[SchemaInputField.Name]).toEqual({ maxLength: 255 });
  });

  test('Should remove one attribute set to undefined', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Title]: { maxLength: undefined } });

    expect(resolved[SchemaInputField.Title]?.maxLength).toBeUndefined();
  });

  test('Should add a field that has no default', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Order]: { min: 0 } });

    expect(resolved[SchemaInputField.Order]).toEqual({ min: 0 });
  });
});

describe('SchemaGrid :: getFieldConstraintViolations', () => {
  const defaults = resolveSchemaFieldInputProps();

  test('Should report nothing for values within the limits', () => {
    const fields = [row({ name: long(255), title: long(255), description: long(1024) })];

    expect(getFieldConstraintViolations(fields, defaults)).toEqual([]);
  });

  test('Should report an over-limit name, title, and description', () => {
    const fields = [row({ name: long(256), title: long(256), description: long(1025) })];

    expect(getFieldConstraintViolations(fields, defaults)).toEqual([
      { field: SchemaInputField.Name, rule: SchemaConstraintRule.MaxLength, limit: 255 },
      { field: SchemaInputField.Title, rule: SchemaConstraintRule.MaxLength, limit: 255 },
      { field: SchemaInputField.Description, rule: SchemaConstraintRule.MaxLength, limit: 1024 },
    ]);
  });

  test('Should check a nested row', () => {
    const fields = [row({ type: 'object', children: [row({ id: 'f2', parentId: 'f1', depth: 1, title: long(256) })] })];

    expect(getFieldConstraintViolations(fields, defaults)).toEqual([
      { field: SchemaInputField.Title, rule: SchemaConstraintRule.MaxLength, limit: 255 },
    ]);
  });

  test('Should report a violation once however many rows break it', () => {
    const fields = [row({ title: long(300) }), row({ id: 'f2', name: 'other', title: long(400) })];

    expect(getFieldConstraintViolations(fields, defaults)).toHaveLength(1);
  });

  test('Should check Tab and Section on a first-level row when the consumer shows them', () => {
    const fields = [row({ dialMeta: { [CATALOG_META_TAB]: long(256), [CATALOG_META_SECTION]: long(256) } })];

    expect(getFieldConstraintViolations(fields, defaults, CATALOG_SCHEMA_META_COLUMNS).map((v) => v.field)).toEqual([
      SchemaInputField.Tab,
      SchemaInputField.Section,
    ]);
  });

  test('Should ignore Tab and Section without their columns or below the first level', () => {
    const meta = { [CATALOG_META_TAB]: long(256), [CATALOG_META_SECTION]: long(256) };
    const nested = [row({ type: 'object', children: [row({ id: 'f2', parentId: 'f1', depth: 1, dialMeta: meta })] })];

    expect(getFieldConstraintViolations([row({ dialMeta: meta })], defaults, [SchemaMetaColumn.Order])).toEqual([]);
    expect(getFieldConstraintViolations(nested, defaults, CATALOG_SCHEMA_META_COLUMNS)).toEqual([]);
  });

  test('Should apply minLength to a non-empty value only', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Title]: { minLength: 3 } });

    expect(getFieldConstraintViolations([row({ title: 'ab' })], resolved)).toEqual([
      { field: SchemaInputField.Title, rule: SchemaConstraintRule.MinLength, limit: 3 },
    ]);
    expect(getFieldConstraintViolations([row({ title: '' })], resolved)).toEqual([]);
  });

  test('Should match a pattern against the whole value', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Name]: { pattern: '[a-z_]+' } });

    expect(getFieldConstraintViolations([row({ name: 'good_name' })], resolved)).toEqual([]);
    expect(getFieldConstraintViolations([row({ name: 'Bad Name' })], resolved)).toEqual([
      { field: SchemaInputField.Name, rule: SchemaConstraintRule.Pattern, limit: '[a-z_]+' },
    ]);
  });

  test('Should ignore a pattern that does not compile', () => {
    const resolved = resolveSchemaFieldInputProps({ [SchemaInputField.Name]: { pattern: '(' } });

    expect(getFieldConstraintViolations([row({ name: 'anything' })], resolved)).toEqual([]);
  });

  test('Should report nothing when the defaults are switched off', () => {
    expect(getFieldConstraintViolations([row({ title: long(1001) })], resolveSchemaFieldInputProps(false))).toEqual([]);
  });
});
