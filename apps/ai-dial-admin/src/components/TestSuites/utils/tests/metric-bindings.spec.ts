import { describe, expect, test } from 'vitest';
import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { generateMetricBindingsRowData } from '../metric-bindings';

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
