import { JSONSchema7 } from 'json-schema';
import { describe, expect, test } from 'vitest';

import { MetricBinding } from '@/src/models/evaluation/metric';
import { isReservedSystemFunctionCondition, validateMetricBindings } from '../utils';
import { MetricBindingType } from '@/src/types/evaluation';

describe('validateMetricBindings', () => {
  const configSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      threshold: { type: 'number' },
      optionalConfig: { type: 'string' },
    },
    required: ['threshold'],
  };

  const inputSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      inputText: { type: 'string' },
    },
    required: ['inputText'],
  };

  const validConfigBindings: MetricBinding[] = [
    {
      property: 'threshold',
      source: {
        $type: MetricBindingType.Constant,
        value: '0.85',
      },
    },
  ];

  const validInputBindings: MetricBinding[] = [
    {
      property: 'inputText',
      source: {
        $type: MetricBindingType.Constant,
        value: 'prompt',
      },
    },
  ];

  test('returns false for empty metric name', () => {
    const isValid = validateMetricBindings('   ', validConfigBindings, validInputBindings, configSchema, inputSchema);

    expect(isValid).toBe(false);
  });

  test('returns false when required fields are not bound', () => {
    const isValid = validateMetricBindings('Metric name', [], [], configSchema, inputSchema);

    expect(isValid).toBe(false);
  });

  test('returns false for Constant binding with empty value', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: MetricBindingType.Constant,
            value: '',
          },
        },
      ],
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(false);
  });

  test('returns false for Constant binding with whitespace-only value', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: MetricBindingType.Constant,
            value: '   ',
          },
        },
      ],
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(false);
  });

  test('returns false for unsupported binding source type', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: 'UnsupportedType' as unknown as MetricBindingType,
          },
        },
      ],
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(false);
  });

  test('returns true for valid required bindings', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      validConfigBindings,
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(true);
  });

  test('returns true for response binding with non-empty columnName', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: MetricBindingType.Response,
            columnName: 'scoreColumn',
          },
        },
      ],
      [
        {
          property: 'inputText',
          source: {
            $type: MetricBindingType.Response,
            columnName: 'promptColumn',
          },
        },
      ],
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(true);
  });

  test('returns false for response binding with empty columnName', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: MetricBindingType.Response,
            columnName: '',
          },
        },
      ],
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(false);
  });

  test('returns false for response binding with whitespace-only columnName', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: MetricBindingType.Response,
            columnName: '   ',
          },
        },
      ],
      validInputBindings,
      configSchema,
      inputSchema,
    );

    expect(isValid).toBe(false);
  });

  test('returns true when there are no required fields and no bindings', () => {
    const schemaWithoutRequired: JSONSchema7 = {
      type: 'object',
      properties: {
        optionalField: { type: 'string' },
      },
    };

    const isValid = validateMetricBindings('Metric name', [], [], schemaWithoutRequired, schemaWithoutRequired);

    expect(isValid).toBe(true);
  });
});

describe('isReservedSystemFunctionCondition', () => {
  test('returns false for undefined, null and empty conditions', () => {
    expect(isReservedSystemFunctionCondition(undefined)).toBe(false);
    expect(isReservedSystemFunctionCondition('')).toBe(false);
    expect(isReservedSystemFunctionCondition('   ')).toBe(false);
  });

  test('returns true for a bare system-function call', () => {
    expect(isReservedSystemFunctionCondition('isLastTurn()')).toBe(true);
    expect(isReservedSystemFunctionCondition('  _first()  ')).toBe(true);
  });

  test('returns false for JSONata expressions ($-prefixed, paths, operators)', () => {
    expect(isReservedSystemFunctionCondition('$exists(response.answer)')).toBe(false);
    expect(isReservedSystemFunctionCondition('$count(data.turns) > 1')).toBe(false);
    expect(isReservedSystemFunctionCondition('response.answer')).toBe(false);
  });

  test('returns false for a call with arguments', () => {
    expect(isReservedSystemFunctionCondition('foo(bar)')).toBe(false);
  });
});
