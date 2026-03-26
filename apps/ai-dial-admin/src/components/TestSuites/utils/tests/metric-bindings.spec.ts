import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import { JSONSchema7 } from 'json-schema';
import { describe, expect, test } from 'vitest';
import { generateMetricDefaultBindings, generateMetricDefaultInputBindings } from '../metric-bindings';


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
