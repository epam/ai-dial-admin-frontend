import { JSONSchema7 } from 'json-schema';
import { describe, expect, test } from 'vitest';

import { MetricBinding } from '@/src/models/evaluation/metric';
import { hasInputTypeMismatch, isReservedSystemFunctionCondition, validateMetricBindings } from '../utils';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { MetricBindingType, TestCaseItemType } from '@/src/types/evaluation';

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
  test('flags a bare system-function call', () => {
    expect(isReservedSystemFunctionCondition('name()')).toBe(true);
  });
  test('allows real JSONata and blanks', () => {
    expect(isReservedSystemFunctionCondition('$exists(response.answer)')).toBe(false);
    expect(isReservedSystemFunctionCondition('turn.last')).toBe(false);
    expect(isReservedSystemFunctionCondition('')).toBe(false);
    expect(isReservedSystemFunctionCondition(undefined)).toBe(false);
  });
});

describe('hasInputTypeMismatch', () => {
  const inputSchema: JSONSchema7 = {
    type: 'object',
    properties: { actual: { type: 'array' }, count: { type: 'number' } },
  };
  const testCaseSchema: TestCaseSchema[] = [
    { name: 'items', type: TestCaseItemType.ARRAY, required: false, description: '' },
    { name: 'question', type: TestCaseItemType.STRING, required: false, description: '' },
    { name: 'total', type: TestCaseItemType.INTEGER, required: false, description: '' },
  ];
  const testCaseBinding = (property: string, columnName: string): MetricBinding => ({
    property,
    source: { $type: MetricBindingType.TestCase, columnName },
  });

  test('returns false when every bound column has the expected type', () => {
    const bindings = [testCaseBinding('actual', 'items'), testCaseBinding('count', 'total')];

    expect(hasInputTypeMismatch(bindings, inputSchema, testCaseSchema)).toBe(false);
  });

  test('returns true when a test case column has a different type', () => {
    expect(hasInputTypeMismatch([testCaseBinding('actual', 'question')], inputSchema, testCaseSchema)).toBe(true);
  });

  test('returns true when a response column has a different type', () => {
    const bindings: MetricBinding[] = [
      { property: 'actual', source: { $type: MetricBindingType.Response, columnName: 'answer' } },
    ];
    const responseColumns = [{ name: 'answer', displayName: 'Answer', expression: '', type: 'string' }];

    expect(hasInputTypeMismatch(bindings, inputSchema, testCaseSchema, responseColumns)).toBe(true);
  });

  test('ignores constants, unselected columns and unknown columns', () => {
    const bindings: MetricBinding[] = [
      { property: 'actual', source: { $type: MetricBindingType.Constant, value: 'x' } },
      { property: 'count', source: { $type: MetricBindingType.TestCase } },
      testCaseBinding('actual', 'missing'),
    ];

    expect(hasInputTypeMismatch(bindings, inputSchema, testCaseSchema)).toBe(false);
  });

  describe('multi-type and untyped inputs', () => {
    const arrayColumns: TestCaseSchema[] = [
      { name: 'items', type: TestCaseItemType.ARRAY, required: false, description: '' },
      { name: 'flag', type: TestCaseItemType.BOOLEAN, required: false, description: '' },
    ];
    const bindArray = [testCaseBinding('actual', 'items')];
    const responseArray = (property: string): MetricBinding[] => [
      { property, source: { $type: MetricBindingType.Response, columnName: 'answer' } },
    ];

    test('accepts any column for a property with no type', () => {
      const schema: JSONSchema7 = { type: 'object', properties: { actual: { description: 'Any value' } } };

      expect(hasInputTypeMismatch(bindArray, schema, arrayColumns)).toBe(false);
    });

    test('accepts every type listed in a union', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          actual: { anyOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'number' }, { type: 'array' }] },
        },
      };
      const responseColumns = [{ name: 'answer', displayName: 'Answer', expression: '', type: 'array' }];

      expect(hasInputTypeMismatch(bindArray, schema, arrayColumns)).toBe(false);
      expect(hasInputTypeMismatch(responseArray('actual'), schema, arrayColumns, responseColumns)).toBe(false);
    });

    test('accepts every type in a type list and resolves $ref variants', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: { actual: { type: ['string', 'array', 'null'] }, other: { oneOf: [{ $ref: '#/$defs/list' }] } },
        $defs: { list: { type: 'array' } },
      };

      expect(hasInputTypeMismatch(bindArray, schema, arrayColumns)).toBe(false);
      expect(hasInputTypeMismatch([testCaseBinding('other', 'items')], schema, arrayColumns)).toBe(false);
    });

    test('still rejects a type outside the union', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: { actual: { anyOf: [{ type: 'string' }, { type: 'array' }, { type: 'null' }] } },
      };

      expect(hasInputTypeMismatch([testCaseBinding('actual', 'flag')], schema, arrayColumns)).toBe(true);
    });
  });
});
