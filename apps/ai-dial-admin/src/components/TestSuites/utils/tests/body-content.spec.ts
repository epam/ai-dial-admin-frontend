import { describe, expect, test } from 'vitest';
import {
  getContentForJsonataExpression,
  getDefaultContentForType,
  getJsonataExpressionForContent,
} from '../body-content';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { FormDataType } from '@/src/models/form-data';

describe('getDefaultContentForType', () => {
  test('returns an empty object for application/json', () => {
    expect(getDefaultContentForType(ContentType.JSON)).toEqual({});
  });

  test('returns an empty array for multipart/form-data', () => {
    expect(getDefaultContentForType(ContentType.FormData)).toEqual([]);
  });

  test('returns an empty object when contentType is undefined', () => {
    expect(getDefaultContentForType(undefined)).toEqual({});
  });

  test('returns an empty object for an unknown content type', () => {
    expect(getDefaultContentForType('text/plain')).toEqual({});
  });
});

describe('getJsonataExpressionForContent', () => {
  test('serializes JSON object content with the JSON editor indentation', () => {
    expect(getJsonataExpressionForContent({ model: 'gpt-4', stream: false })).toBe(
      JSON.stringify({ model: 'gpt-4', stream: false }, null, 4),
    );
  });

  test('serializes nested JSON object content', () => {
    const content = { messages: [{ role: 'user', content: 'hi' }] };

    expect(getJsonataExpressionForContent(content)).toBe(JSON.stringify(content, null, 4));
  });

  test('returns "{}" for empty object content', () => {
    expect(getJsonataExpressionForContent({})).toBe('{}');
  });

  test('returns "{}" when content is undefined', () => {
    expect(getJsonataExpressionForContent(undefined)).toBe('{}');
  });

  test('returns "{}" for form-data parts rather than serializing them', () => {
    expect(getJsonataExpressionForContent([{ name: 'file', value: 'a.txt', type: FormDataType.File }])).toBe('{}');
  });

  test('returns "{}" for empty form-data parts', () => {
    expect(getJsonataExpressionForContent([])).toBe('{}');
  });
});

describe('getContentForJsonataExpression', () => {
  test('restores a parseable JSON object expression under JSON content type', () => {
    expect(getContentForJsonataExpression('{ "model": "gpt-4" }', ContentType.JSON)).toEqual({ model: 'gpt-4' });
  });

  test('restores a parseable JSON object expression when contentType is absent', () => {
    expect(getContentForJsonataExpression('{"a":1}', undefined)).toEqual({ a: 1 });
  });

  test('falls back to the type default for a real JSONata expression', () => {
    expect(getContentForJsonataExpression('$sum(items.price)', ContentType.JSON)).toEqual({});
  });

  test('falls back to the type default for an empty expression', () => {
    expect(getContentForJsonataExpression('', ContentType.JSON)).toEqual({});
  });

  test('falls back to the type default when the expression is undefined', () => {
    expect(getContentForJsonataExpression(undefined, ContentType.JSON)).toEqual({});
  });

  test('falls back to the type default for a JSON array expression', () => {
    expect(getContentForJsonataExpression('[1, 2]', ContentType.JSON)).toEqual({});
  });

  test('falls back to the type default for a JSON scalar expression', () => {
    expect(getContentForJsonataExpression('42', ContentType.JSON)).toEqual({});
    expect(getContentForJsonataExpression('null', ContentType.JSON)).toEqual({});
  });

  test('never carries an object into a form-data body', () => {
    expect(getContentForJsonataExpression('{ "model": "gpt-4" }', ContentType.FormData)).toEqual([]);
  });
});
