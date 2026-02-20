import { describe, test, expect } from 'vitest';
import { generateInputBindingsRowData } from '../template-variables';
import { InputBinding, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

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
