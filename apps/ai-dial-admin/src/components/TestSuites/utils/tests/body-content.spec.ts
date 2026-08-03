import { describe, expect, test } from 'vitest';
import { getBodyText, getContentForJsonataExpression, getDefaultContentForType } from '../body-content';
import { ContentType } from '@/src/components/TestSuites/constants/content-type';
import { FormDataType } from '@/src/models/form-data';

const JSONATA_EXPRESSION = [
  '{',
  '    "messages": $append($history, [{ "role": "user", "content": "${{user_message}}" }]),',
  '    "temperature": "${{temperature:0.7}}"',
  '}',
].join('\n');

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

describe('getBodyText', () => {
  test('returns jsonataContent verbatim, including JSONata syntax and placeholders', () => {
    expect(getBodyText({ contentType: ContentType.JSON, jsonataContent: JSONATA_EXPRESSION })).toBe(JSONATA_EXPRESSION);
  });

  test('returns an empty jsonataContent as the empty string', () => {
    expect(getBodyText({ contentType: ContentType.JSON, jsonataContent: '' })).toBe('');
  });

  test('prefers jsonataContent over content', () => {
    expect(getBodyText({ jsonataContent: '$sum(items.price)', content: { model: 'gpt-4' } })).toBe('$sum(items.price)');
  });

  test('serializes JSON object content with the JSON editor indentation', () => {
    const content = { model: 'gpt-4', stream: false };

    expect(getBodyText({ contentType: ContentType.JSON, content })).toBe(JSON.stringify(content, null, 4));
  });

  test('serializes nested JSON object content', () => {
    const content = { messages: [{ role: 'user', content: 'hi' }] };

    expect(getBodyText({ contentType: ContentType.JSON, content })).toBe(JSON.stringify(content, null, 4));
  });

  test('returns "{}" for empty object content', () => {
    expect(getBodyText({ contentType: ContentType.JSON, content: {} })).toBe('{}');
  });

  test('returns "{}" when content is absent', () => {
    expect(getBodyText({ contentType: ContentType.JSON })).toBe('{}');
  });

  test('returns "{}" when the body is undefined', () => {
    expect(getBodyText(undefined)).toBe('{}');
  });

  test('returns no text for form-data parts, which have no text editor', () => {
    expect(getBodyText({ contentType: ContentType.FormData, content: [] })).toBe('');
    expect(
      getBodyText({
        contentType: ContentType.FormData,
        content: [{ name: 'file', value: 'a.txt', type: FormDataType.File }],
      }),
    ).toBe('');
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

  test('falls back to the type default for JSONata embedded in JSON-looking text', () => {
    expect(getContentForJsonataExpression(JSONATA_EXPRESSION, ContentType.JSON)).toEqual({});
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
