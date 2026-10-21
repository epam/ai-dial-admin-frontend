import { describe, expect, test } from 'vitest';
import {
  filterParameterBindings,
  getTemplateParameterVariables,
  getTemplateParameters,
} from '../request-template-params';
import { InputBinding, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

describe('getTemplateParameters', () => {
  test('should return empty array when template is undefined', () => {
    expect(getTemplateParameters(undefined)).toEqual([]);
  });

  test('should extract template parameters from url, body, headers and query params', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{tenantId}}/resource/${{resourceId:default-id}}',
      body: {
        content: {
          metadata: {
            owner: '${{owner}}',
          },
          tags: ['${{tag1}}', '${{tag2:default-tag}}'],
        },
      },
      headers: [
        { key: 'x-user', value: '${{userId}}' },
        { key: 'x-static', value: 'static-value' },
      ],
      queryParams: [
        { key: 'search', value: '${{searchTerm}}' },
        { key: 'page', value: '${{page:1}}' },
      ],
    };

    expect(getTemplateParameters(template)).toEqual([
      'tenantId',
      'resourceId',
      'owner',
      'tag1',
      'tag2',
      'userId',
      'searchTerm',
      'page',
    ]);
  });

  test('should return unique parameter names preserving first occurrence order', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{id}}/${{id:default-id}}',
      body: {
        content: {
          ref: '${{id}}',
          nested: {
            another: '${{other}}',
            list: ['${{id}}', '${{other}}'],
          },
        },
      },
      headers: [{ key: 'x-id', value: '${{id}}' }],
      queryParams: [{ key: 'q', value: '${{other}}' }],
    };

    expect(getTemplateParameters(template)).toEqual(['id', 'other']);
  });

  test('should trim whitespace around parameter names', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{  tenantId  }}',
      body: {
        content: {
          id: '${{  resourceId :default-resource }}',
        },
      },
    };

    expect(getTemplateParameters(template)).toEqual(['tenantId', 'resourceId']);
  });

  test('should ignore non-string values while traversing nested structures', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/static',
      body: {
        content: {
          count: 12,
          enabled: true,
          details: {
            nullable: null,
            values: [1, false, { deep: '${{deepVar}}' }],
          },
        },
      },
    };

    expect(getTemplateParameters(template)).toEqual(['deepVar']);
  });

  test('extracts a placeholder written inside a jsonataContent expression', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api',
      body: { jsonataContent: '{ "q": "${{question}}" }' },
    };

    expect(getTemplateParameters(template)).toEqual(['question']);
  });

  test('should strip the type hint from the name in all documented placeholder forms', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{tenant|string}}',
      body: {
        content: {
          document: '${{file|file}}',
          context: '${{ctx|file:public/data.txt}}',
          temperature: '${{temperature|number:0.7}}',
        },
      },
      headers: [{ key: 'x-attempts', value: '${{attempts|integer}}' }],
      queryParams: [{ key: 'stream', value: '${{stream|boolean}}' }],
    };

    expect(getTemplateParameters(template)).toEqual(['tenant', 'file', 'ctx', 'temperature', 'attempts', 'stream']);
  });

  test('should treat a hinted and an unhinted occurrence of one variable as the same name', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{document|file}}',
      body: { content: { ref: '${{document}}' } },
    };

    expect(getTemplateParameters(template)).toEqual(['document']);
  });

  test('should trim whitespace around a type hint', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{  document  |  file  }}',
    };

    expect(getTemplateParameters(template)).toEqual(['document']);
  });
});

describe('getTemplateParameterVariables', () => {
  test('should return empty array when template is undefined', () => {
    expect(getTemplateParameterVariables(undefined)).toEqual([]);
  });

  test('should return empty array when template has no placeholders', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/static',
      body: { content: { message: 'static text' } },
    };

    expect(getTemplateParameterVariables(template)).toEqual([]);
  });

  test('should scan url, body, headers and query params, marking defaults', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{tenantId}}/resource/${{resourceId:default-id}}',
      body: {
        content: {
          metadata: { owner: '${{owner}}' },
        },
      },
      headers: [{ key: 'x-user', value: '${{userId}}' }],
      queryParams: [{ key: 'page', value: '${{page:1}}' }],
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      { name: 'tenantId', hasDefault: false, defaultValue: null, effectiveType: TestCaseItemType.STRING, sources: [] },
      {
        name: 'resourceId',
        hasDefault: true,
        defaultValue: 'default-id',
        effectiveType: TestCaseItemType.STRING,
        sources: [],
      },
      { name: 'owner', hasDefault: false, defaultValue: null, effectiveType: TestCaseItemType.STRING, sources: [] },
      { name: 'userId', hasDefault: false, defaultValue: null, effectiveType: TestCaseItemType.STRING, sources: [] },
      { name: 'page', hasDefault: true, defaultValue: '1', effectiveType: TestCaseItemType.STRING, sources: [] },
    ]);
  });

  test('extracts a placeholder written inside a jsonataContent expression', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api',
      body: { jsonataContent: '{ "q": "${{question:fallback}}" }' },
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      {
        name: 'question',
        hasDefault: true,
        defaultValue: 'fallback',
        effectiveType: TestCaseItemType.STRING,
        sources: [],
      },
    ]);
  });

  test('should dedupe repeated placeholders, keeping the first occurrence default', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{id:first-default}}/${{id:second-default}}',
      body: { content: { ref: '${{id}}' } },
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      {
        name: 'id',
        hasDefault: true,
        defaultValue: 'first-default',
        effectiveType: TestCaseItemType.STRING,
        sources: [],
      },
    ]);
  });

  test('should trim whitespace around parameter names and default values', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{  resourceId : default-resource  }}',
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      {
        name: 'resourceId',
        hasDefault: true,
        defaultValue: 'default-resource',
        effectiveType: TestCaseItemType.STRING,
        sources: [],
      },
    ]);
  });

  test('should map every documented type hint onto the matching effective type', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{tenant|string}}',
      body: {
        content: {
          attempts: '${{attempts|integer}}',
          temperature: '${{temperature|number}}',
          stream: '${{stream|boolean}}',
          payload: '${{payload|object}}',
          messages: '${{messages|array}}',
          document: '${{document|file}}',
        },
      },
    };

    expect(getTemplateParameterVariables(template).map(({ name, effectiveType }) => ({ name, effectiveType }))).toEqual(
      [
        { name: 'tenant', effectiveType: TestCaseItemType.STRING },
        { name: 'attempts', effectiveType: TestCaseItemType.INTEGER },
        { name: 'temperature', effectiveType: TestCaseItemType.NUMBER },
        { name: 'stream', effectiveType: TestCaseItemType.BOOLEAN },
        { name: 'payload', effectiveType: TestCaseItemType.OBJECT },
        { name: 'messages', effectiveType: TestCaseItemType.ARRAY },
        { name: 'document', effectiveType: TestCaseItemType.FILE },
      ],
    );
  });

  test('should name the variable after the hint-free name when hint and name are identical', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/upload',
      body: { content: { attachment: '${{file|file}}' } },
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      { name: 'file', hasDefault: false, defaultValue: null, effectiveType: TestCaseItemType.FILE, sources: [] },
    ]);
  });

  test('should read a type hint and a default value from the same placeholder', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{ctx|file:public/data.txt}}',
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      {
        name: 'ctx',
        hasDefault: true,
        defaultValue: 'public/data.txt',
        effectiveType: TestCaseItemType.FILE,
        sources: [],
      },
    ]);
  });

  test('should fall back to string for an unknown or differently cased type hint', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{first|timestamp}}/${{second|FILE}}/${{third|}}',
    };

    expect(getTemplateParameterVariables(template).map(({ name, effectiveType }) => ({ name, effectiveType }))).toEqual(
      [
        { name: 'first', effectiveType: TestCaseItemType.STRING },
        { name: 'second', effectiveType: TestCaseItemType.STRING },
        { name: 'third', effectiveType: TestCaseItemType.STRING },
      ],
    );
  });

  test('should keep a default value that itself contains a pipe or a colon', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{separator:a|b}}',
      body: { content: { url: '${{endpoint:https://example.com}}' } },
    };

    expect(getTemplateParameterVariables(template)).toEqual([
      { name: 'separator', hasDefault: true, defaultValue: 'a|b', effectiveType: TestCaseItemType.STRING, sources: [] },
      {
        name: 'endpoint',
        hasDefault: true,
        defaultValue: 'https://example.com',
        effectiveType: TestCaseItemType.STRING,
        sources: [],
      },
    ]);
  });
});

describe('filterParameterBindings', () => {
  test('should return undefined when bindings is undefined', () => {
    expect(filterParameterBindings(undefined, ['id'])).toBeUndefined();
  });

  test('should return original bindings when param names are empty', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'tenantId', dataField: 'tenant.id' },
      { templateVariable: 'session', constantValue: 'abc' },
    ];

    expect(filterParameterBindings(bindings, [])).toBe(bindings);
  });

  test('should keep bindings with exact template variable matches', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'tenantId', dataField: 'tenant.id' },
      { templateVariable: 'session', constantValue: 'abc' },
      { templateVariable: 'userId', dataField: 'user.id' },
    ];

    expect(filterParameterBindings(bindings, ['tenantId', 'userId'])).toEqual([
      { templateVariable: 'tenantId', dataField: 'tenant.id' },
      { templateVariable: 'userId', dataField: 'user.id' },
    ]);
  });

  test('should keep bindings when template variable exact parameter name', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'tenantId.raw', dataField: 'tenant.raw' },
      { templateVariable: 'tenant-id', dataField: 'tenant.id' },
      { templateVariable: 'region', constantValue: 'us' },
    ];

    expect(filterParameterBindings(bindings, ['tenantId', 'tenant-id'])).toEqual([
      { templateVariable: 'tenant-id', dataField: 'tenant.id' },
    ]);
  });

  test('should return empty array when no bindings match parameter names', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'region', constantValue: 'us' },
      { templateVariable: 'environment', dataField: 'env.name' },
    ];

    expect(filterParameterBindings(bindings, ['tenantId', 'userId'])).toEqual([]);
  });

  test('keeps the binding for a placeholder that carries a type hint', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'file', dataField: 'attachment' },
      { templateVariable: 'ctx', constantValue: 'public/data.txt' },
    ];
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{ctx|file:public/data.txt}}',
      body: { content: { attachment: '${{file|file}}' } },
    };

    expect(filterParameterBindings(bindings, getTemplateParameters(template))).toEqual(bindings);
  });

  test('drops a binding left behind under the pre-fix hint-inclusive name', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'file|file', dataField: 'attachment' },
      { templateVariable: 'file', dataField: 'attachment' },
    ];
    const template: TestSuiteRequestTemplate = {
      body: { content: { attachment: '${{file|file}}' } },
    };

    expect(filterParameterBindings(bindings, getTemplateParameters(template))).toEqual([
      { templateVariable: 'file', dataField: 'attachment' },
    ]);
  });

  test('drops the binding for a placeholder removed from a jsonataContent expression', () => {
    const bindings: InputBinding[] = [
      { templateVariable: 'question', dataField: 'x' },
      { templateVariable: 'other', constantValue: 'y' },
    ];
    const templateAfterEdit: TestSuiteRequestTemplate = {
      urlTemplate: '/api',
      body: { jsonataContent: '{ "q": "literal", "r": "${{other}}" }' },
    };

    const paramNames = getTemplateParameters(templateAfterEdit);

    expect(paramNames).toEqual(['other']);
    expect(filterParameterBindings(bindings, paramNames)).toEqual([{ templateVariable: 'other', constantValue: 'y' }]);
  });
});
