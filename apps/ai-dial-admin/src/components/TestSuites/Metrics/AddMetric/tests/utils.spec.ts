import { JSONSchema7 } from 'json-schema';
import { describe, expect, test } from 'vitest';

import { MetricBinding } from '@/src/models/evaluation/metric';
import { validateMetricBindings } from '../utils';

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
        $type: 'Constant',
        value: '0.85',
      },
    },
  ];

  const validInputBindings: MetricBinding[] = [
    {
      property: 'inputText',
      source: {
        $type: 'Column',
        columnName: 'prompt',
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
            $type: 'Constant',
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

  test('returns false for unsupported binding source type', () => {
    const isValid = validateMetricBindings(
      'Metric name',
      [
        {
          property: 'threshold',
          source: {
            $type: 'UnsupportedType',
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
});
