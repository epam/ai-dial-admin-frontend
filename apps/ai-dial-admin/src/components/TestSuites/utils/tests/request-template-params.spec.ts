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
        metadata: {
          owner: '${{owner}}',
        },
        tags: ['${{tag1}}', '${{tag2:default-tag}}'],
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
        ref: '${{id}}',
        nested: {
          another: '${{other}}',
          list: ['${{id}}', '${{other}}'],
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
        id: '${{  resourceId :default-resource }}',
      },
    };

    expect(getTemplateParameters(template)).toEqual(['tenantId', 'resourceId']);
  });

  test('should ignore non-string values while traversing nested structures', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/static',
      body: {
        count: 12,
        enabled: true,
        details: {
          nullable: null,
          values: [1, false, { deep: '${{deepVar}}' }],
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
});

describe('getTemplateParameterVariables', () => {
  test('should return empty array when template is undefined', () => {
    expect(getTemplateParameterVariables(undefined)).toEqual([]);
  });

  test('should return empty array when template has no placeholders', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/static',
      body: { message: 'static text' },
    };

    expect(getTemplateParameterVariables(template)).toEqual([]);
  });

  test('should scan url, body, headers and query params, marking defaults', () => {
    const template: TestSuiteRequestTemplate = {
      urlTemplate: '/api/${{tenantId}}/resource/${{resourceId:default-id}}',
      body: {
        metadata: { owner: '${{owner}}' },
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
      body: { ref: '${{id}}' },
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
