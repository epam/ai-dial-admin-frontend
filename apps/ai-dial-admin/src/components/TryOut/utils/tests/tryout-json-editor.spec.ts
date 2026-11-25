import { describe, expect, test } from 'vitest';

import { toTryOutJsonEditorProps } from '../tryout-json-editor';

describe('toTryOutJsonEditorProps', () => {
  test('passes an object as entity without turning validation off', () => {
    const body = { choices: [{ message: { content: 'hi' } }] };

    expect(toTryOutJsonEditorProps(body)).toEqual({
      entity: body,
      options: { wordWrap: 'off' },
    });
  });

  test('passes an array as entity with validation decorations off', () => {
    const events = [{ event: 'delta', data: { text: 'a' } }];

    expect(toTryOutJsonEditorProps(events)).toEqual({
      entity: events,
      options: { wordWrap: 'off', renderValidationDecorations: 'off' },
    });
  });

  test('parses a JSON object string into entity', () => {
    expect(toTryOutJsonEditorProps('{"ok":true}')).toEqual({
      entity: { ok: true },
      options: { wordWrap: 'off' },
    });
  });

  test('parses a JSON array string into entity with validation off', () => {
    expect(toTryOutJsonEditorProps('[{"event":"x"}]')).toEqual({
      entity: [{ event: 'x' }],
      options: { wordWrap: 'off', renderValidationDecorations: 'off' },
    });
  });

  test('keeps a truncated JSON string as text with validation off', () => {
    expect(toTryOutJsonEditorProps('{"choices":[{"message":')).toEqual({
      entity: null,
      text: '{"choices":[{"message":',
      options: { wordWrap: 'off', renderValidationDecorations: 'off' },
    });
  });

  test('keeps a non-JSON string as text with validation off', () => {
    expect(toTryOutJsonEditorProps('not json')).toEqual({
      entity: null,
      text: 'not json',
      options: { wordWrap: 'off', renderValidationDecorations: 'off' },
    });
  });

  test('returns null entity for undefined', () => {
    expect(toTryOutJsonEditorProps(undefined)).toEqual({
      entity: null,
      options: { wordWrap: 'off' },
    });
  });

  test('merges caller base options', () => {
    expect(toTryOutJsonEditorProps({ a: 1 }, { wordWrap: 'bounded' })).toEqual({
      entity: { a: 1 },
      options: { wordWrap: 'bounded' },
    });
  });
});
