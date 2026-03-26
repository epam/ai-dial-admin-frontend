import { describe, expect, test } from 'vitest';
import { JSONSchema7 } from 'json-schema';
import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import {
  createUpdatedMetricBinding,
  generateMetricBindingsRowData,
  generateMetricDefaultBindings,
  generateMetricDefaultInputBindings,
} from '../metric-bindings';

const schemaField = (name: string, id = name): SchemaFieldRow =>
  ({
    id,
    name,
    type: 'string',
    required: false,
    description: '',
    expanded: false,
    children: [],
    parentId: null,
    depth: 0,
    title: '',
  }) as SchemaFieldRow;

describe('generateMetricBindingsRowData', () => {
  test('returns empty array when both schemas are empty', () => {
    const result = generateMetricBindingsRowData([], [], [], []);
    expect(result).toEqual([]);
  });

  test('returns default bindings for config schema when no existing bindings', () => {
    const configSchema = [schemaField('apiKey'), schemaField('timeout')];
    const result = generateMetricBindingsRowData([], [], configSchema, []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'apiKey',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
    expect(result[1]).toEqual({
      property: 'timeout',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
  });

  test('returns default bindings for input schema when no existing bindings', () => {
    const inputSchema = [schemaField('prompt'), schemaField('model')];
    const result = generateMetricBindingsRowData([], [], [], inputSchema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'prompt',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
    expect(result[1]).toEqual({
      property: 'model',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
  });

  test('returns config rows first then input rows', () => {
    const configSchema = [schemaField('configA')];
    const inputSchema = [schemaField('inputB')];
    const result = generateMetricBindingsRowData([], [], configSchema, inputSchema);

    expect(result).toHaveLength(2);
    expect(result[0].property).toBe('configA');
    expect(result[1].property).toBe('inputB');
  });

  test('uses existing config binding when present', () => {
    const configSchema = [schemaField('apiKey')];
    const existingConfig: MetricBinding[] = [
      { property: 'apiKey', source: { $type: MetricBindingType.Constant, value: 'secret-123' } },
    ];
    const result = generateMetricBindingsRowData(existingConfig, [], configSchema, []);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      property: 'apiKey',
      source: { $type: MetricBindingType.Constant, value: 'secret-123' },
    });
  });

  test('uses existing input binding when present', () => {
    const inputSchema = [schemaField('prompt')];
    const existingInput: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Column, columnName: 'user_input' } },
    ];
    const result = generateMetricBindingsRowData([], existingInput, [], inputSchema);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      property: 'prompt',
      source: { $type: MetricBindingType.Column, columnName: 'user_input' },
    });
  });

  test('mixes existing bindings with defaults for missing schema fields', () => {
    const configSchema = [schemaField('apiKey'), schemaField('timeout')];
    const existingConfig: MetricBinding[] = [
      { property: 'apiKey', source: { $type: MetricBindingType.Constant, value: 'key' } },
    ];
    const result = generateMetricBindingsRowData(existingConfig, [], configSchema, []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ property: 'apiKey', source: { $type: MetricBindingType.Constant, value: 'key' } });
    expect(result[1]).toEqual({ property: 'timeout', source: { $type: MetricBindingType.Constant, value: '' } });
  });

  test('combines config and input with existing bindings for both', () => {
    const configSchema = [schemaField('configField')];
    const inputSchema = [schemaField('inputField')];
    const existingConfig: MetricBinding[] = [
      { property: 'configField', source: { $type: MetricBindingType.Constant, value: 'config-val' } },
    ];
    const existingInput: MetricBinding[] = [
      { property: 'inputField', source: { $type: MetricBindingType.Column, columnName: 'col' } },
    ];
    const result = generateMetricBindingsRowData(existingConfig, existingInput, configSchema, inputSchema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'configField',
      source: { $type: MetricBindingType.Constant, value: 'config-val' },
    });
    expect(result[1]).toEqual({
      property: 'inputField',
      source: { $type: MetricBindingType.Column, columnName: 'col' },
    });
  });

  test('ignores existing bindings that do not match any schema field', () => {
    const configSchema = [schemaField('onlyField')];
    const existingConfig: MetricBinding[] = [
      { property: 'onlyField', source: { $type: MetricBindingType.Constant, value: 'used' } },
      { property: 'orphan', source: { $type: MetricBindingType.Constant, value: 'ignored' } },
    ];
    const result = generateMetricBindingsRowData(existingConfig, [], configSchema, []);

    expect(result).toHaveLength(1);
    expect(result[0].property).toBe('onlyField');
    expect(result[0].source.value).toBe('used');
  });
});

describe('createUpdatedMetricBinding', () => {
  test('updates source.$type and clears value and columnName', () => {
    const data: MetricBinding = {
      property: 'prompt',
      source: { $type: MetricBindingType.Constant, value: 'hello' },
    };
    const result = createUpdatedMetricBinding(MetricBindingType.TestCase, data, 'source.$type');

    expect(result.property).toBe('prompt');
    expect(result.source.$type).toBe(MetricBindingType.TestCase);
    expect(result.source.value).toBeUndefined();
    expect(result.source.columnName).toBeUndefined();
  });

  test('updates value when field is not source.$type and type is Constant', () => {
    const data: MetricBinding = {
      property: 'apiKey',
      source: { $type: MetricBindingType.Constant, value: 'old' },
    };
    const result = createUpdatedMetricBinding('new-secret', data, 'source.value');

    expect(result.property).toBe('apiKey');
    expect(result.source.$type).toBe(MetricBindingType.Constant);
    expect(result.source.value).toBe('new-secret');
    expect(result.source.columnName).toBeUndefined();
  });

  test('updates columnName when field is not source.$type and type is not Constant', () => {
    const data: MetricBinding = {
      property: 'inputField',
      source: { $type: MetricBindingType.TestCase, columnName: 'old_col' },
    };
    const result = createUpdatedMetricBinding('new_col', data, 'source.columnName');

    expect(result.property).toBe('inputField');
    expect(result.source.$type).toBe(MetricBindingType.TestCase);
    expect(result.source.columnName).toBe('new_col');
    expect(result.source.value).toBeUndefined();
  });

  test('clears columnName when updating Constant value', () => {
    const data: MetricBinding = {
      property: 'key',
      source: { $type: MetricBindingType.Constant, value: 'v', columnName: 'stale' },
    };
    const result = createUpdatedMetricBinding('new-value', data, 'other');

    expect(result.source.value).toBe('new-value');
    expect(result.source.columnName).toBeUndefined();
  });

  test('clears value when updating non-Constant columnName', () => {
    const data: MetricBinding = {
      property: 'col',
      source: { $type: MetricBindingType.Response, columnName: 'c', value: 'stale' },
    };
    const result = createUpdatedMetricBinding('response_col', data, 'other');

    expect(result.source.columnName).toBe('response_col');
    expect(result.source.value).toBeUndefined();
  });

  test('does not mutate original data', () => {
    const data: MetricBinding = {
      property: 'p',
      source: { $type: MetricBindingType.Constant, value: 'original' },
    };
    const result = createUpdatedMetricBinding('updated', data, 'source.value');

    expect(data.source.value).toBe('original');
    expect(result.source.value).toBe('updated');
  });
});

describe('generateMetricDefaultInputBindings', () => {
  test('returns empty array for schema with no properties', () => {
    const schema: JSONSchema7 = { type: 'object' };
    expect(generateMetricDefaultInputBindings(schema)).toEqual([]);
  });

  test('returns empty array for empty schema', () => {
    expect(generateMetricDefaultInputBindings({})).toEqual([]);
  });

  test('returns Constant bindings with default values when schema has property defaults', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Alice' },
        count: { type: 'integer', default: 10 },
      },
    };
    const result = generateMetricDefaultInputBindings(schema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'name',
      source: { $type: MetricBindingType.Constant, value: 'Alice' },
    });
    expect(result[1]).toEqual({
      property: 'count',
      source: { $type: MetricBindingType.Constant, value: 10 },
    });
  });

  test('returns Constant bindings with type-based empty values when no default', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        score: { type: 'number' },
      },
    };
    const result = generateMetricDefaultInputBindings(schema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'prompt',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
    expect(result[1]).toEqual({
      property: 'score',
      source: { $type: MetricBindingType.Constant, value: 0 },
    });
  });
});

describe('generateMetricDefaultBindings', () => {
  test('returns object with name and ids from details', () => {
    const details: Metric = {
      id: 'ver-1',
      metricDeclarationId: 'decl-1',
      inputSchema: { type: 'object', properties: {} },
      configSchema: { type: 'object', properties: {} },
    };
    const result = generateMetricDefaultBindings('My Metric', details, [], []);

    expect(result.name).toBe('My Metric');
    expect(result.metricDeclarationId).toBe('decl-1');
    expect(result.metricDeclarationVersionId).toBe('ver-1');
    expect(result.inputBindings).toEqual([]);
    expect(result.configBindings).toEqual([]);
  });

  test('builds inputBindings from inputSchema defaults', () => {
    const details: Metric = {
      metricDeclarationId: 'd1',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', default: 'default-query' },
        },
      },
      configSchema: {},
    };
    const result = generateMetricDefaultBindings('Test', details, [], []);

    expect(result.inputBindings).toHaveLength(1);
    expect(result.inputBindings![0]).toEqual({
      property: 'query',
      source: { $type: MetricBindingType.Constant, value: 'default-query' },
    });
    expect(result.configBindings).toEqual([]);
  });

  test('builds configBindings from configSchema defaults', () => {
    const details: Metric = {
      configSchema: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          timeout: { type: 'integer', default: 30 },
        },
      },
      inputSchema: {},
    };
    const result = generateMetricDefaultBindings('Test', details, [], []);

    expect(result.configBindings).toHaveLength(2);
    expect(result.configBindings![0]).toEqual({
      property: 'apiKey',
      source: { $type: MetricBindingType.Constant, value: '' },
    });
    expect(result.configBindings![1]).toEqual({
      property: 'timeout',
      source: { $type: MetricBindingType.Constant, value: 30 },
    });
    expect(result.inputBindings).toEqual([]);
  });

  test('uses empty object when details has no schemas', () => {
    const result = generateMetricDefaultBindings('Minimal', {} as Metric, [], []);

    expect(result.name).toBe('Minimal');
    expect(result.metricDeclarationId).toBeUndefined();
    expect(result.metricDeclarationVersionId).toBeUndefined();
    expect(result.inputBindings).toEqual([]);
    expect(result.configBindings).toEqual([]);
  });

  test('uses provided bindings when they are not empty', () => {
    const details: Metric = {
      id: 'ver-2',
      metricDeclarationId: 'decl-2',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', default: 'from-schema' },
        },
      },
      configSchema: {
        type: 'object',
        properties: {
          apiKey: { type: 'string', default: 'from-schema' },
        },
      },
    };

    const inputBindings: MetricBinding[] = [
      {
        property: 'query',
        source: { $type: MetricBindingType.Column, columnName: 'user_query' },
      },
    ];
    const configBindings: MetricBinding[] = [
      {
        property: 'apiKey',
        source: { $type: MetricBindingType.Constant, value: 'manual-key' },
      },
    ];

    const result = generateMetricDefaultBindings('Provided', details, configBindings, inputBindings);

    expect(result.inputBindings).toEqual(inputBindings);
    expect(result.configBindings).toEqual(configBindings);
  });
});
