import { describe, expect, test } from 'vitest';
import { filterParameterBindings, getTemplateParameters } from '../request-template-params';
import { InputBinding, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';

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
});
