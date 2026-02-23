import { describe, test, expect } from 'vitest';
import {
  convertVariableIntoInitialRequest,
  generateInputBindingsRowData,
  generateVariablesRowData,
} from '../template-variables';
import { InputBinding, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

const createVariable = (overrides?: Partial<TemplateVariable>): TemplateVariable => ({
  name: 'var1',
  inferredType: TestCaseItemType.STRING,
  defaultValue: null,
  hasDefault: false,
  sources: ['body'],
  ...overrides,
});

describe('generateInputBindingsRowData', () => {
  test('should return empty array when variables is empty', () => {
    const result = generateInputBindingsRowData([], []);
    expect(result).toEqual([]);
  });

  test('should map variable to Constant type when no binding exists', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.STRING,
        defaultValue: 'default',
        hasDefault: true,
        sources: ['body'],
      },
    ];

    const result = generateInputBindingsRowData(variables, []);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.STRING,
        constantValue: undefined,
        type: InputBindingType.Constant,
        value: '',
        defaultValue: 'default',
      },
    ]);
  });

  test('should map variable to Constant type when binding has constantValue', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: ['body'],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'var1',
        constantValue: 'fixed-value',
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.STRING,
        constantValue: 'fixed-value',
        type: InputBindingType.Constant,
        value: 'fixed-value',
        defaultValue: null,
      },
    ]);
  });

  test('should map variable to Attribute type when binding has dataField', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.NUMBER,
        defaultValue: 0,
        hasDefault: true,
        sources: ['query'],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'var1',
        dataField: 'fieldName',
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.NUMBER,
        dataField: 'fieldName',
        type: InputBindingType.Attribute,
        value: 'fieldName',
        defaultValue: 0,
      },
    ]);
  });

  test('should handle multiple variables with mixed bindings', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'attr_var',
        inferredType: TestCaseItemType.STRING,
        defaultValue: 'def1',
        hasDefault: true,
        sources: ['body'],
      },
      {
        name: 'const_var',
        inferredType: TestCaseItemType.BOOLEAN,
        defaultValue: false,
        hasDefault: true,
        sources: ['header'],
      },
      {
        name: 'unbound_var',
        inferredType: TestCaseItemType.OBJECT,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'attr_var',
        dataField: 'myField',
      },
      {
        templateVariable: 'const_var',
        constantValue: true,
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result).toEqual([
      {
        templateVariable: 'attr_var',
        inferredType: TestCaseItemType.STRING,
        dataField: 'myField',
        type: InputBindingType.Attribute,
        value: 'myField',
        defaultValue: 'def1',
      },
      {
        templateVariable: 'const_var',
        inferredType: TestCaseItemType.BOOLEAN,
        constantValue: true,
        type: InputBindingType.Constant,
        value: true,
        defaultValue: false,
      },
      {
        templateVariable: 'unbound_var',
        inferredType: TestCaseItemType.OBJECT,
        constantValue: undefined,
        type: InputBindingType.Constant,
        value: '',
        defaultValue: null,
      },
    ]);
  });

  test('should prefer dataField over constantValue when both are present', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'var1',
        dataField: 'field1',
        constantValue: 'constant1',
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.STRING,
        dataField: 'field1',
        type: InputBindingType.Attribute,
        value: 'field1',
        defaultValue: null,
      },
    ]);
  });

  test('should treat dataField as null when binding dataField is null', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.ARRAY,
        defaultValue: [],
        hasDefault: true,
        sources: ['body'],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'var1',
        dataField: undefined,
        constantValue: 'fallback',
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.ARRAY,
        constantValue: 'fallback',
        type: InputBindingType.Constant,
        value: 'fallback',
        defaultValue: [],
      },
    ]);
  });

  test('should use empty string as value when constantValue is undefined', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'var1',
        inferredType: TestCaseItemType.STRING,
        defaultValue: undefined,
        hasDefault: false,
        sources: [],
      },
    ];
    const bindings: InputBinding[] = [
      {
        templateVariable: 'var1',
      },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result[0].value).toBe('');
    expect(result[0].type).toBe(InputBindingType.Constant);
  });

  test('should handle constantValue of falsy values correctly', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'zero_var',
        inferredType: TestCaseItemType.NUMBER,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
      {
        name: 'empty_var',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
      {
        name: 'false_var',
        inferredType: TestCaseItemType.BOOLEAN,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
    ];
    const bindings: InputBinding[] = [
      { templateVariable: 'zero_var', constantValue: 0 },
      { templateVariable: 'empty_var', constantValue: '' },
      { templateVariable: 'false_var', constantValue: false },
    ];

    const result = generateInputBindingsRowData(variables, bindings);

    expect(result[0].value).toBe(0);
    expect(result[1].value).toBe('');
    expect(result[2].value).toBe(false);
  });

  test('should preserve variable order from input array', () => {
    const variables: TemplateVariable[] = [
      {
        name: 'c',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
      {
        name: 'a',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
      {
        name: 'b',
        inferredType: TestCaseItemType.STRING,
        defaultValue: null,
        hasDefault: false,
        sources: [],
      },
    ];

    const result = generateInputBindingsRowData(variables, []);

    expect(result.map((r) => r.templateVariable)).toEqual(['c', 'a', 'b']);
  });
});

describe('generateVariablesRowData', () => {
  test('should return empty array when variables is empty', () => {
    const result = generateVariablesRowData([], {});
    expect(result).toEqual([]);
  });

  test('should map variable with matching requestBody value', () => {
    const variables = [createVariable({ name: 'var1', defaultValue: 'default' })];
    const requestBody = { var1: 'hello' };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result).toEqual([
      {
        templateVariable: 'var1',
        inferredType: TestCaseItemType.STRING,
        value: 'hello',
        defaultValue: 'default',
      },
    ]);
  });

  test('should use empty string as value when variable is not in requestBody', () => {
    const variables = [createVariable({ name: 'missing' })];

    const result = generateVariablesRowData(variables, {});

    expect(result[0].value).toBe('');
  });

  test('should handle multiple variables with mixed presence in requestBody', () => {
    const variables = [
      createVariable({ name: 'present', inferredType: TestCaseItemType.STRING, defaultValue: 'def1' }),
      createVariable({ name: 'absent', inferredType: TestCaseItemType.NUMBER, defaultValue: 42 }),
      createVariable({ name: 'also_present', inferredType: TestCaseItemType.BOOLEAN, defaultValue: false }),
    ];
    const requestBody = { present: 'value1', also_present: true };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result).toEqual([
      {
        templateVariable: 'present',
        inferredType: TestCaseItemType.STRING,
        value: 'value1',
        defaultValue: 'def1',
      },
      {
        templateVariable: 'absent',
        inferredType: TestCaseItemType.NUMBER,
        value: '',
        defaultValue: 42,
      },
      {
        templateVariable: 'also_present',
        inferredType: TestCaseItemType.BOOLEAN,
        value: true,
        defaultValue: false,
      },
    ]);
  });

  test('should handle falsy values in requestBody correctly', () => {
    const variables = [
      createVariable({ name: 'zero_var', inferredType: TestCaseItemType.NUMBER }),
      createVariable({ name: 'empty_var', inferredType: TestCaseItemType.STRING }),
      createVariable({ name: 'false_var', inferredType: TestCaseItemType.BOOLEAN }),
    ];
    const requestBody = { zero_var: 0, empty_var: '', false_var: false };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result[0].value).toBe(0);
    expect(result[1].value).toBe('');
    expect(result[2].value).toBe(false);
  });

  test('should handle object and array values in requestBody', () => {
    const variables = [
      createVariable({ name: 'obj_var', inferredType: TestCaseItemType.OBJECT }),
      createVariable({ name: 'arr_var', inferredType: TestCaseItemType.ARRAY }),
    ];
    const objValue = { key: 'value' };
    const arrValue = [1, 2, 3];
    const requestBody = { obj_var: objValue, arr_var: arrValue };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result[0].value).toEqual({ key: 'value' });
    expect(result[1].value).toEqual([1, 2, 3]);
  });

  test('should preserve variable order from input array', () => {
    const variables = [createVariable({ name: 'c' }), createVariable({ name: 'a' }), createVariable({ name: 'b' })];

    const result = generateVariablesRowData(variables, {});

    expect(result.map((r) => r.templateVariable)).toEqual(['c', 'a', 'b']);
  });

  test('should use null as value when requestBody value is null', () => {
    const variables = [createVariable({ name: 'null_var' })];
    const requestBody = { null_var: null };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result[0].value).toBe('');
  });

  test('should use undefined fallback to empty string', () => {
    const variables = [createVariable({ name: 'undef_var' })];
    const requestBody = { undef_var: undefined };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result[0].value).toBe('');
  });

  test('should ignore extra keys in requestBody not present in variables', () => {
    const variables = [createVariable({ name: 'var1' })];
    const requestBody = { var1: 'matched', extra: 'ignored' };

    const result = generateVariablesRowData(variables, requestBody);

    expect(result).toHaveLength(1);
    expect(result[0].templateVariable).toBe('var1');
  });
});

describe('convertVariableIntoInitialRequest', () => {
  test('should return empty object when variables is empty', () => {
    const result = convertVariableIntoInitialRequest([]);
    expect(result).toEqual({});
  });

  test('should create request with empty string for single variable', () => {
    const variables = [createVariable({ name: 'var1' })];

    const result = convertVariableIntoInitialRequest(variables);

    expect(result).toEqual({ var1: '' });
  });

  test('should create request with empty strings for multiple variables', () => {
    const variables = [
      createVariable({ name: 'alpha' }),
      createVariable({ name: 'beta' }),
      createVariable({ name: 'gamma' }),
    ];

    const result = convertVariableIntoInitialRequest(variables);

    expect(result).toEqual({ alpha: '', beta: '', gamma: '' });
  });

  test('should ignore defaultValue and use empty string', () => {
    const variables = [
      createVariable({ name: 'with_default', defaultValue: 'some-default' }),
      createVariable({ name: 'with_number_default', defaultValue: 42 }),
      createVariable({ name: 'with_object_default', defaultValue: { key: 'val' } }),
    ];

    const result = convertVariableIntoInitialRequest(variables);

    expect(result).toEqual({
      with_default: '',
      with_number_default: '',
      with_object_default: '',
    });
  });

  test('should handle variables of all inferred types', () => {
    const variables = [
      createVariable({ name: 'str', inferredType: TestCaseItemType.STRING }),
      createVariable({ name: 'num', inferredType: TestCaseItemType.NUMBER }),
      createVariable({ name: 'bool', inferredType: TestCaseItemType.BOOLEAN }),
      createVariable({ name: 'obj', inferredType: TestCaseItemType.OBJECT }),
      createVariable({ name: 'arr', inferredType: TestCaseItemType.ARRAY }),
    ];

    const result = convertVariableIntoInitialRequest(variables);

    expect(Object.keys(result)).toEqual(['str', 'num', 'bool', 'obj', 'arr']);
    Object.values(result).forEach((value) => {
      expect(value).toBe('');
    });
  });

  test('should preserve variable order as object keys', () => {
    const variables = [createVariable({ name: 'c' }), createVariable({ name: 'a' }), createVariable({ name: 'b' })];

    const result = convertVariableIntoInitialRequest(variables);

    expect(Object.keys(result)).toEqual(['c', 'a', 'b']);
  });

  test('should overwrite duplicate variable names with empty string', () => {
    const variables = [createVariable({ name: 'dup' }), createVariable({ name: 'dup' })];

    const result = convertVariableIntoInitialRequest(variables);

    expect(result).toEqual({ dup: '' });
    expect(Object.keys(result)).toHaveLength(1);
  });
});
