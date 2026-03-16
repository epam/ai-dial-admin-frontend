import { describe, expect, test } from 'vitest';
import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import { createUpdatedMetricBinding, generateMetricBindingsRowData } from '../metric-bindings';

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
      source: { $type: 'Constant', value: '' },
    });
    expect(result[1]).toEqual({
      property: 'timeout',
      source: { $type: 'Constant', value: '' },
    });
  });

  test('returns default bindings for input schema when no existing bindings', () => {
    const inputSchema = [schemaField('prompt'), schemaField('model')];
    const result = generateMetricBindingsRowData([], [], [], inputSchema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'prompt',
      source: { $type: 'Constant', value: '' },
    });
    expect(result[1]).toEqual({
      property: 'model',
      source: { $type: 'Constant', value: '' },
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
      { property: 'apiKey', source: { $type: 'Constant', value: 'secret-123' } },
    ];
    const result = generateMetricBindingsRowData(existingConfig, [], configSchema, []);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      property: 'apiKey',
      source: { $type: 'Constant', value: 'secret-123' },
    });
  });

  test('uses existing input binding when present', () => {
    const inputSchema = [schemaField('prompt')];
    const existingInput: MetricBinding[] = [
      { property: 'prompt', source: { $type: 'Column', columnName: 'user_input' } },
    ];
    const result = generateMetricBindingsRowData([], existingInput, [], inputSchema);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      property: 'prompt',
      source: { $type: 'Column', columnName: 'user_input' },
    });
  });

  test('mixes existing bindings with defaults for missing schema fields', () => {
    const configSchema = [schemaField('apiKey'), schemaField('timeout')];
    const existingConfig: MetricBinding[] = [{ property: 'apiKey', source: { $type: 'Constant', value: 'key' } }];
    const result = generateMetricBindingsRowData(existingConfig, [], configSchema, []);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ property: 'apiKey', source: { $type: 'Constant', value: 'key' } });
    expect(result[1]).toEqual({ property: 'timeout', source: { $type: 'Constant', value: '' } });
  });

  test('combines config and input with existing bindings for both', () => {
    const configSchema = [schemaField('configField')];
    const inputSchema = [schemaField('inputField')];
    const existingConfig: MetricBinding[] = [
      { property: 'configField', source: { $type: 'Constant', value: 'config-val' } },
    ];
    const existingInput: MetricBinding[] = [{ property: 'inputField', source: { $type: 'Column', columnName: 'col' } }];
    const result = generateMetricBindingsRowData(existingConfig, existingInput, configSchema, inputSchema);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      property: 'configField',
      source: { $type: 'Constant', value: 'config-val' },
    });
    expect(result[1]).toEqual({
      property: 'inputField',
      source: { $type: 'Column', columnName: 'col' },
    });
  });

  test('ignores existing bindings that do not match any schema field', () => {
    const configSchema = [schemaField('onlyField')];
    const existingConfig: MetricBinding[] = [
      { property: 'onlyField', source: { $type: 'Constant', value: 'used' } },
      { property: 'orphan', source: { $type: 'Constant', value: 'ignored' } },
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
