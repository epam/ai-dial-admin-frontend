import { describe, expect, test } from 'vitest';

import { normalizeResponseBodyForColumns, unwrapJsonRequestBody } from '../column-eval-context';

describe('unwrapJsonRequestBody', () => {
  test('unwraps application/json content wrapper to the payload', () => {
    const body = {
      contentType: 'application/json',
      content: { messages: [{ role: 'user', content: 'hi' }], temperature: 0.7 },
    };

    expect(unwrapJsonRequestBody(body)).toEqual(body.content);
  });

  test('leaves a bare chat-completion body unchanged', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }] };

    expect(unwrapJsonRequestBody(body)).toEqual(body);
  });
});

describe('normalizeResponseBodyForColumns', () => {
  test('leaves a body that already has choices unchanged', () => {
    const body = { choices: [{ message: { role: 'assistant', content: 'ok' } }] };

    expect(normalizeResponseBodyForColumns(body)).toEqual(body);
  });

  test('aggregates streamed delta events into choices[].message', () => {
    const body = {
      events: [
        { choices: [{ delta: { role: 'assistant' }, index: 0 }] },
        { choices: [{ delta: { content: 'Hel' }, index: 0 }] },
        { choices: [{ delta: { content: 'lo' }, index: 0 }] },
      ],
    };

    expect(normalizeResponseBodyForColumns(body)?.choices).toEqual([
      {
        index: 0,
        finish_reason: 'stop',
        message: { role: 'assistant', content: 'Hello' },
      },
    ]);
  });

  test('prefers a complete message choice when present in events', () => {
    const body = {
      events: [{ choices: [{ message: { role: 'assistant', content: 'done' }, finish_reason: 'stop' }] }],
    };

    expect(normalizeResponseBodyForColumns(body)?.choices).toEqual([
      { message: { role: 'assistant', content: 'done' }, finish_reason: 'stop' },
    ]);
  });
});
